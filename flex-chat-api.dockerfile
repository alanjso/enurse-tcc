FROM node:10.19.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install pm2 -g

COPY . .

EXPOSE 80
EXPOSE 443
EXPOSE 4000
EXPOSE 4001

CMD ["pm2-runtime","ecosystem.config.js"]
#CMD ["pm2-runtime", "server.js"]