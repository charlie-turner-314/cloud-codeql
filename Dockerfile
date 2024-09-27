# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code (excluding the .dockerignore files)
COPY . .

# Install CodeQL CLI
RUN curl -LO https://github.com/github/codeql-action/releases/download/codeql-bundle-v2.18.3/codeql-bundle-linux64.tar.gz \
    && tar xf codeql-bundle-linux64.tar.gz \
    && rm codeql-bundle-linux64.tar.gz \
    && mv codeql /opt/codeql

# Set environment variables
ENV PATH="/opt/codeql/:${PATH}"

ENV PORT=80

# Expose port
EXPOSE 80

# Run the application 
CMD ["npm", "start"]