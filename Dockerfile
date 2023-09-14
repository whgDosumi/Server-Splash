FROM node

COPY node /var/node
WORKDIR /var/node 
RUN npm install
CMD node /var/node/main.js