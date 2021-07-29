
FROM node:12

#
# Install Java
#
RUN apt-get update && \
    apt-get install -y default-jdk && \
	java -version

#
# Add our application
#

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .


#
# Start our application
#
ENV DEBUG asn1-playground:*

# Expose Node Server port
EXPOSE 3000

CMD [ "npm", "start" ]
