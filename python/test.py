from geopy.geocoders import Nominatim

word = 'paris'
geolocator = Nominatim(user_agent="app.py", timeout=10)
location = geolocator.geocode(word)
country = geolocator.reverse([location.latitude,location.longitude], language='fr')
print(location)
print(location.latitude)
print(location.longitude)
print(country)