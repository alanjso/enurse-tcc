# Deploy Sudo Docker

sudo docker build -f e-nurse.dockerfile -t e-nurse:1 .
sudo docker rm -f e-nurse
sudo docker run -d -p 4000:4000 --name e-nurse --restart unless-stopped -e "NODE_ENV=production" -v "/var/arquivos/:/usr/src/app/uploads/" -e TZ=Brazil/East e-nurse:1
sudo docker logs -f e-nurse

# Deploy Docker

docker build -f e-nurse.dockerfile -t e-nurse:5 .
docker rm -f e-nurse
docker run -d -p 4000:4000 --name e-nurse --restart unless-stopped -e "NODE_ENV=production" -v "/var/arquivos/:/usr/src/app/uploads/" -e TZ=Brazil/East e-nurse:5
docker logs -f e-nurse
