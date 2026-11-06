# syntax=docker/dockerfile:1
# Backend AAP_TUUA (API .NET 10)
#   docker build . -t aap_tuua_api:latest
#   docker run -d --name aap_tuua_api -p 8282:8080 \
#     -e connectionString="Server=...;Database=...;User Id=...;Password=..." \
#     -e Smtp__host=smtp.office365.com -e Smtp__user=... -e Smtp__password=... -e Smtp__from=... \
#     aap_tuua_api:latest

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# restore en una capa propia para aprovechar la caché cuando solo cambia el código
COPY AAP_TUUA.slnx ./
COPY AAP_TUUA.API/AAP_TUUA.API.csproj AAP_TUUA.API/
COPY AAP_TUUA.Business/AAP_TUUA.Business.csproj AAP_TUUA.Business/
COPY AAP_TUUA.Dao/AAP_TUUA.Dao.csproj AAP_TUUA.Dao/
COPY AAP_TUUA.Entidades/AAP_TUUA.Entidades.csproj AAP_TUUA.Entidades/
RUN dotnet restore AAP_TUUA.API/AAP_TUUA.API.csproj

COPY AAP_TUUA.API/ AAP_TUUA.API/
COPY AAP_TUUA.Business/ AAP_TUUA.Business/
COPY AAP_TUUA.Dao/ AAP_TUUA.Dao/
COPY AAP_TUUA.Entidades/ AAP_TUUA.Entidades/
RUN dotnet publish AAP_TUUA.API/AAP_TUUA.API.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

# - fonts-liberation / fonts-dejavu-core: PDFsharp (build Core) no trae fuentes; SystemFontResolver
#   las busca en /usr/share/fonts/truetype/liberation y /usr/share/fonts/truetype/dejavu.
# - tzdata + TZ: la fecha del día (precios vigentes, vuelos a la venta) debe calcularse con la hora de Perú,
#   no en UTC.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-liberation fonts-dejavu-core tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=America/Lima \
    ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

WORKDIR /app
COPY --from=build /app/publish .

USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "AAP_TUUA.API.dll"]
