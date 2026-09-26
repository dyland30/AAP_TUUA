#build
dotnet build .

#run project
dotnet run --project AAP_TUUA.API/AAP_TUUA.API.csproj


#compilar imagen docker

docker build . -t aap_tuua_api:latest

#ejecutar imagen en puerto 8282
docker run -d --name aap_tuua_api -p 8282:8080 aap_tuua_api:latest
