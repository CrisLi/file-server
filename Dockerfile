FROM node:6
MAINTAINER Chris Li

RUN mkdir -p /opt/app
COPY . /opt/app
WORKDIR /opt/app

RUN npm install --production

# ENV PORT 3000
# ENV MONGO_URL mongodb://mongo/app_files
# EXPOSE $PORT

CMD ["npm", "start"]