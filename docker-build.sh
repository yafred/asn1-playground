#!/bin/bash

#
# Build docker image using non released asn1-tool
#

echo "JAVA_HOME=/usr/local/openjdk-8" > .env
echo "WORKING_DIR=/tmp" >> .env
echo "JAVA_TOOLS_DIR=/usr/src/app" >> .env
cp ../tool-1.0-SNAPSHOT-compiler-with-beautifier.jar  asn1-compiler-with-google-java-format.jar
cp ../tool-1.0-SNAPSHOT-converter.jar asn1-converter.jar
cp ../runtime-1.0-SNAPSHOT.jar asn1-runtime.jar

docker build -t yafred/asn1-playground .
