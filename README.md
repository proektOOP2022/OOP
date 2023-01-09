# Road map quality

Представляем вашему вниманию проект по ооп - карта качества дорог. Наша команда предлагает инструмент, который анализируя фотографии дорог из выбранной области, отображает их качество.

Разработанный нами проект работает довольно просто, каждый раз, когда пользователь указывает область, мы загружаем фото из панорам дорог, далее они обрабатываются при помощи нейросети, после чего на выходе мы считаем количество распознанных ею ям, при помощи специальной формулы «ставим» оценку этому участку, а в конце показываем на карте результат.

## Структура
- [Machine learning](#ML)
- [Panorama Loader](#panorama-loader)
- [RMQ and Docker](#rmq-and-docker)
- [Site](#site)

### ML
[ML](/ML)

- [detr_finetuning_custom_dataset](/ML/detr_finetuning_custom_dataset.ipynb) - ноутбук для обучения нейросети
- [imgaug](/ML/imgaug.ipynb) - ноутбук для создания датасета
- [detr](/ML/detr.py) - А я хз что писать

### Panorama Loader
[Panorama Loader](/Panorama%20Loader)

- [app](/Panorama%20Loader/app.js) - скачивание фотографий с понорам

### RMQ and Docker
[RMQ](/RMQ%20(Docker))

- [database_service](/RMQ%20(Docker)/database_service/database_service.js) - комментарий
- [road_analyzer](/RMQ%20(Docker)/road_analyzer/road_analyzer.js) - выводим на основании полученных данных от нейросети качество дороги на карту
- [config](/RMQ%20(Docker)/config.json) - настройки для rabbitMQ

### Site
[site](/RMQ%20(Docker)/socket_server/site)

- [web](/RMQ%20(Docker)/socket_server/site/index.html) - сайт для проекта

### Архитектура
<img width="500" alt="image" src="https://github.com/proektOOP2022/OOP/blob/main/RMQ%20(Docker)/socket_server/site/assets/images/fftt.png">
