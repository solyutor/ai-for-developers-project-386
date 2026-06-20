FROM node:22-alpine AS frontend-build
WORKDIR /app/backend/CalendarBooking.Api/Frontend
COPY backend/CalendarBooking.Api/Frontend/package*.json .
RUN npm ci
COPY backend/CalendarBooking.Api/Frontend/ .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ .
# Frontend is built in the separate stage above — remove from this stage
# so the MSBuild target doesn't try to run npm (no Node in SDK image)
RUN rm -rf CalendarBooking.Api/Frontend CalendarBooking.Api/wwwroot
RUN dotnet restore CalendarBooking.Api
RUN dotnet publish CalendarBooking.Api -c Release -o /publish
COPY --from=frontend-build /app/backend/CalendarBooking.Api/wwwroot /publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:4010
EXPOSE 4010
COPY --from=backend-build /publish .
ENTRYPOINT ["dotnet", "CalendarBooking.Api.dll"]
