FROM node

COPY node /var/node
WORKDIR /var/node 
RUN npm install
COPY version.txt /var/node/public/version.txt
CMD node /var/node/main.js