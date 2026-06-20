FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ .
RUN dotnet restore CalendarBooking.Api
RUN dotnet publish CalendarBooking.Api -c Release -o /publish
COPY --from=frontend-build /app/frontend/dist /publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:4010
EXPOSE 4010
COPY --from=backend-build /publish .
ENTRYPOINT ["dotnet", "CalendarBooking.Api.dll"]
