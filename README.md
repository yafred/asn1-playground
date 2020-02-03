# ASN.1 Playground

Web front-end (Node.js) and docker image to play with https://github.com/yafred/asn1-tool

[![Build Status](https://travis-ci.org/yafred/asn1-tool.svg?branch=master)](https://travis-ci.org/yafred/asn1-tool)

## Using the node application

  * Clone this repository
  * Download the jars from [last asn1-tool release](https://github.com/yafred/asn1-tool/releases) 
  * Create a .env file and set following properties
  
```
JAVA_HOME=< where your Java JDK is installed>
WORKING_DIR=< where this application can create some files>
JAVA_TOOLS_DIR=< where asn1-tool jars are downloaded >
``` 

  * Start application 
 
```
npm start
```
  

## Using the docker image

```
docker run -p 3000:3000 yafred/asn1-playground
```