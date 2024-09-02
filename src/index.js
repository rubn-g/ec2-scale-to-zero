const { AwsClient } = require('aws4fetch')

const ec2Action = (env, action) => {
	const url = `https://ec2.${env.AWS_REGION}.amazonaws.com/?Action=${action}&InstanceId.1=${env.EC2_INSTANCE_ID}&Version=2016-11-15`

	const client = new AwsClient({
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	})

	return client.fetch(url).then(res => res.text())
}

const tickUsage = req => caches.default.put(req, new Response(1, {
	headers: {
		'content-type': 'text/plain',
		'cache-control': 'max-age=300',
	}
}))

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)

		url.hostname = env.ORIGIN_HOSTNAME
		url.port = url.protocol == 'http:' ? '80' : '443'

		const req = new Request(url, request)

		ctx.waitUntil(tickUsage(new Request('http://' + url.hostname)))

		for (let attempt = 0; attempt < 10; attempt++) {
			try {
				return await fetch(req, {
					signal: AbortSignal.timeout(env.TIMEOUT)
				})
			} catch(e) {
				console.log('error', e.message)

				if (e.retryable) {
					if (attempt == 0) {
						const res = await ec2Action(env, 'StartInstances')

						if (!res.includes('<name>pending</name>')) {
							throw new Error('EC2 API error: ' + res)
						}
					}

					await new Promise(resolve => setTimeout(resolve, 500))
				} else {
					throw e
				}
			}
		}
	},
	async scheduled(event, env, ctx) {
		const cached = await caches.default.match(new Request('http://' + env.ORIGIN_HOSTNAME))

		console.log('active', !!cached)

		if (!cached) {
			const res = await ec2Action(env, 'StopInstances')

			if (res.includes('<name>stopping</name>')) {
				console.log('stopping instance')
			} else if (res.includes('<name>stopped</name>')) {
				console.log('instance not running')
			} else {
				throw new Error('EC2 API error: ' + res)
			}
		}
	},
};
