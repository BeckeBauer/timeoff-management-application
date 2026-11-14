# -------------------------------------------------------------------
# Minimal dockerfile from alpine base
#
# Instructions:
# =============
# 1. From the project root, build the image:
#
#	docker build --tag BeckeBauer/timeoff-management-application .
#
# 2. Run the container:
#
#	docker run -d -p 3000:3000 --name alpine_timeoff BeckeBauer/timeoff-management-application
#
# 3. Login to the running container:
#
#	docker exec -ti --user root alpine_timeoff /bin/sh
# --------------------------------------------------------------------
FROM node:22-alpine AS dependencies

RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine


ARG USERID=10001

LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.docker.cmd="docker run -d -p 3000:3000 --name alpine_timeoff"

RUN apk add --no-cache vim

RUN adduser -D -h /app -u "$USERID" timeoff-app
WORKDIR /app
COPY --from=dependencies --chown=timeoff-app:timeoff-app /app/node_modules ./node_modules
COPY --chown=timeoff-app:timeoff-app . /app
 


CMD ["npm", "start"]

EXPOSE 3000
