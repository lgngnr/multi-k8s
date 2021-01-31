docker build -t lgngr/multi-client:latest -t lgngr/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t lgngr/multi-server:latest -t lgngr/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t lgngr/multi-worker:latest -t lgngr/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push lgngr/multi-client:latest 
docker push lgngr/multi-client:$SHA
docker push lgngr/multi-server:latest 
docker push lgngr/multi-server:$SHA 
docker push lgngr/multi-worker:latest 
docker push lgngr/multi-worker:$SHA

kubectl apply -f k8s

kubectl set image deployments/client-deployment server=lgngr/multi-client:$SHA
kubectl set image deployments/server-deployment client=lgngr/multi-server:$SHA
kubectl set image deployments/worker-deployment worker=lgngr/multi-worker:$SHA

