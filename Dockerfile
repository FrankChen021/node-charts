FROM node:15.8
WORKDIR /app
EXPOSE 80

# nodejs dependecies
COPY package.json ./
RUN sed -i s@/deb.debian.org/@/mirrors.aliyun.com/@g /etc/apt/sources.list

# required by canvas
RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
RUN npm install

COPY service.js service.js
COPY STHeiti-Light.ttc STHeiti-Light.ttc

# sys env
ENV LANG C.UTF-8

# app env
ENV OSS_REGION="NONE"
ENV OSS_ACCESSKEY="NONE"
ENV OSS_SECRET="NONE"
ENV OSS_BUCKET="NONE"

ENTRYPOINT node service.js --port=80 --oss-region=$OSS_REGION --oss-accessKeyId=$OSS_ACCESSKEY --oss-accessKeySecret=$OSS_SECRET --oss-bucket=$OSS_BUCKET --oss-name-prefix=image-service-nj
