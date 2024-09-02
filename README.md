# EC2 Scale to Zero

This is a Cloudflare worker to add automatic scale to zero, and start on request, feature to an ec2 instance

## Prerequisites

- You will need to have Node.js and npm installed on your machine.
- You will need to have a Cloudflare account.

## How it works

This worker will proxy your requests to your ec2 instance, if the request returns a timeout, it will try to start the ec2 instance and retry the request until the instance is ready and the request is successful.

A cron task will be scheduled to run every 5 minutes to check if requests were received in the last 5 minutes, if not, it will stop the ec2 instance.

## Installation

**1. Clone this repo**

```bash
git clone https://github.com/rubn-g/ec2-scale-to-zero.git
```

**2. Install dependencies**

```bash
npm install
```

**3. Modify the `wrangler.toml` file with your own values for:**
- `name`: set a worker name of your choice
- `TIMEOUT`: set a high value for the timeout of the requests to your ec2 instance. This should be higher than the time it takes for your ec2 instance to process the request.
- `AWS_REGION`: set the region of your ec2 instance
- `ORIGIN_HOSTNAME`: set the hostname or ip address of your ec2 instance
- `EC2_INSTANCE_ID`: set the id of your ec2 instance

<br>

**4. If you're not already logged in, login to Cloudflare**

```bash
npx wrangler login
```

**5. Add your AWS credentials secrets**

```bash
npx wrangler secret put AWS_ACCESS_KEY_ID
```

```bash
npx wrangler secret put AWS_SECRET_ACCESS_KEY
```

**6. Deploy to Cloudflare**

```bash
npx wrangler deploy
```

## Local development

You will need to follow from step 1 to step 3 of the installation section.

Create a `.dev.vars` file from the `.dev.vars.example` and fill it with your AWS credentials.

Then to run the worker locally, you can use the `wrangler dev` command. This will start a local server that you can use to test your worker.

You can test the cron task by using the following URL:
http://localhost:8787/__scheduled?cron%3D0%2B%2A%2B%2A%2B%2A%2B%2A
