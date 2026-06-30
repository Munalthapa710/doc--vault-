FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY PersonalVault.Api.csproj ./
RUN dotnet restore PersonalVault.Api.csproj

COPY . ./
RUN dotnet publish PersonalVault.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
COPY --from=build /app/publish ./
ENTRYPOINT ["dotnet", "PersonalVault.Api.dll"]
