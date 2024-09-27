docker buildx build -t codeql-analysis --platform linux/amd64 . --progress plain

# tag for ec2
docker tag codeql-analysis 901444280953.dkr.ecr.ap-southeast-2.amazonaws.com/ecr-n10752846:latest

# push to ecr
docker push 901444280953.dkr.ecr.ap-southeast-2.amazonaws.com/ecr-n10752846:latest