# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY AAP_TUUA.API/AAP_TUUA.API.csproj AAP_TUUA.API/
COPY AAP_TUUA.Business/AAP_TUUA.Business.csproj AAP_TUUA.Business/
COPY AAP_TUUA.Dao/AAP_TUUA.Dao.csproj AAP_TUUA.Dao/
COPY AAP_TUUA.Entidades/AAP_TUUA.Entidades.csproj AAP_TUUA.Entidades/
RUN dotnet restore AAP_TUUA.API/AAP_TUUA.API.csproj

COPY . .
RUN dotnet publish AAP_TUUA.API/AAP_TUUA.API.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "AAP_TUUA.API.dll"]
