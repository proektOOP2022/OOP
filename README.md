# Road map quality

Представляем вашему вниманию проект по ооп - карта качества дорог. Данный проект был выполнен в рамках курса Объектно-ориентированного программирования. Сервис по запросу пользователя определяет качество дорог в выбранной области на карте. Ямы и неровности на дороге определяет нейросеть.

## Структура
- [Machine learning](#ML)
- [Panorama Loader](#panorama-loader)
- [RMQ and Docker](#rmq-and-docker)
- [Site](#site)

### ML
[ML](/ML)

- [detr_finetuning_custom_dataset](/ML/detr_finetuning_custom_dataset.ipynb) - Ноутбук для обучения нейросети
- [imgaug](/ML/imgaug.ipynb) - Ноутбук для создания датасета
- [detr](/ML/detr.py) - А я хз что писать

### Panorama Loader
[Panorama Loader](/Panorama%20Loader)

- [app](/Panorama%20Loader/app.js) - Скачивание фотографий с понорам

### RMQ and Docker
[RMQ](/RMQ%20(Docker))

- [database_service](/RMQ%20(Docker)/database_service/database_service.js) - комментарий
- [road_analyzer](/RMQ%20(Docker)/road_analyzer/road_analyzer/.js) - выводим на основании полученных данных от нейросети качество дороги на карту
- [config](/RMQ%20(Docker)/config) - настройки для rabbitMQ

### Site
[site](/RMQ%20(Docker)/socket_server/site)

- [web](/RMQ%20(Docker)/socket_server/site/index.html) - сайт для проекта