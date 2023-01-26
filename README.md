# ASN.1 Playground

Web front-end (Node.js) and docker image to play with https://github.com/yafred/asn1-tool

[![Build Status](https://travis-ci.org/yafred/asn1-playground.svg?branch=master)](https://travis-ci.org/yafred/asn1-playground)


## Using the docker image

  * Pull and start image 
  
```
docker run -p 3000:3000 yafred/asn1-playground
```

  * Access web application with your browser on port 3000 

## Using the node application

  * Install a Java 11+ JDK (we need java and javac)
  * Download the jars from [latest asn1-tool release](https://github.com/yafred/asn1-tool/releases) 
  * Clone this repository
  * Create a .env file at the root of the repository and set following properties
  
```
JAVA_HOME=< where your Java JDK is installed>
WORKING_DIR=< where this application can create some files>
ASN1_COMPILER_JAR=< where asn1-tool compiler is downloaded >
ASN1_CONVERTER_JAR=< where asn1-tool converter is downloaded >
ASN1_RUNTIME_JAR=< where asn1-tool runtime is downloaded >
``` 

  * Verbose 

```
set DEBUG=asn1-playground:*
```

  * Download dependencies 
 
```
npm install
```

  * Start application 
 
```
npm start
```

  * Access web application with your browser on port 3000 
