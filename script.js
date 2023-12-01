$(document).ready(function () {

    var apiKey = '767baab1ba615005b7b57e268ed513fe';

    var cityEl = $('h2#city');
    var dateEl = $('h3#date');
    var weatherIconEl = $('img#weather-icon');
    var temperatureEl = $('span#temperature');
    var humidityEl = $('span#humidity');
    var windEl = $('span#wind');
    var uvIndexEl = $('span#uv-index');
    var cityListEl = $('div.cityList');

   var cityInput = $('#city-input');

    var pastCities = [];

   function compare(a, b) {
          var cityA = a.city.toUpperCase();
       var cityB = b.city.toUpperCase();

       var comparison = 0;
       if (cityA > cityB) {
           comparison = 1;
       } else if (cityA < cityB) {
           comparison = -1;
       }
       return comparison;
   }

    function loadCities() {
        var storedCities = JSON.parse(localStorage.getItem('pastCities'));
        if (storedCities) {
            pastCities = storedCities;
        }
    }

    function storeCities() {
        localStorage.setItem('pastCities', JSON.stringify(pastCities));
    }

    function buildURLFromInputs(city) {
        if (city) {
            return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        }
    }

    function buildURLFromId(id) {
        return `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${apiKey}`;
    }

     function displayCities(pastCities) {
        cityListEl.empty();
        pastCities.splice(5);
        var sortedCities = [...pastCities];
        sortedCities.sort(compare);
        sortedCities.forEach(function (location) {
            var cityDiv = $('<div>').addClass('col-12 city');
            var cityBtn = $('<button>').addClass('btn btn-light city-btn').text(location.city);
            cityDiv.append(cityBtn);
            cityListEl.append(cityDiv);
        });
    }

    function setUVIndexColor(uvi) {
        if (uvi < 3) {
            return 'green';
        } else if (uvi >= 3 && uvi < 6) {
            return 'yellow';
        } else if (uvi >= 6 && uvi < 8) {
            return 'orange';
        } else if (uvi >= 8 && uvi < 11) {
            return 'red';
        } else return 'purple';
    }


    function searchWeather(queryURL) {


        $.ajax({
            url: queryURL,
            method: 'GET'
        }).then(function (response) {
            var city = response.name;
            var id = response.id;
            if (pastCities[0]) {
                pastCities = $.grep(pastCities, function (storedCity) {
                    return id !== storedCity.id;
                })
            }
            pastCities.unshift({ city, id });
            storeCities();
            displayCities(pastCities);
            cityEl.text(response.name);
            var formattedDate = moment.unix(response.dt).format('L');
            dateEl.text(formattedDate);
            var weatherIcon = response.weather[0].icon;
            weatherIconEl.attr('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`).attr('alt', response.weather[0].description);
            temperatureEl.html(((response.main.temp - 273.15) * 1.8 + 32).toFixed(1));
            humidityEl.text(response.main.humidity);
            windEl.text((response.wind.speed * 2.237).toFixed(1));

            var lat = response.coord.lat;
            var lon = response.coord.lon;
            var queryURLAll = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
            $.ajax({
                url: queryURLAll,
                method: 'GET'
            }).then(function (response) {
                var uvIndex = response.current.uvi;
                var uvColor = setUVIndexColor(uvIndex);
                uvIndexEl.text(response.current.uvi);
                uvIndexEl.attr('style', `background-color: ${uvColor}; color: ${uvColor === "yellow" ? "black" : "white"}`);
                var fiveDay = response.daily;

                for (let i = 0; i <= 5; i++) {
                    let currDay = fiveDay[i];
                    $(`div.day-${i} .card-title`).text(moment.unix(currDay.dt).format('L'));
                    $(`div.day-${i} .fiveDay-img`).attr(
                        'src',
                        `http://openweathermap.org/img/wn/${currDay.weather[0].icon}.png`
                    ).attr('alt', currDay.weather[0].description);
                    $(`div.day-${i} .fiveDay-temp`).text(((currDay.temp.day - 273.15) * 1.8 + 32).toFixed(1));
                    $(`div.day-${i} .fiveDay-humid`).text(currDay.humidity);
                }
            });
        });
    }

     function displayLastSearchedCity() {
        if (pastCities[0]) {
            var queryURL = buildURLFromId(pastCities[0].id);
            searchWeather(queryURL);
        } else {
            var queryURL = buildURLFromInputs("Tampa");
            searchWeather(queryURL);
        }
    }

    $('#search-btn').on('click', function (event) {
        event.preventDefault();

        var city = cityInput.val().trim();
        city = city.replace(' ', '%20');

    
        cityInput.val('');

        if (city) {
            var queryURL = buildURLFromInputs(city);
            searchWeather(queryURL);
        }
    }); 
    
    $(document).on("click", "button.city-btn", function (event) {
        var clickedCity = $(this).text();
        var foundCity = $.grep(pastCities, function (storedCity) {
            return clickedCity === storedCity.city;
        })
        var queryURL = buildURLFromId(foundCity[0].id)
        searchWeather(queryURL);
    });


    loadCities();
    displayCities(pastCities);

    displayLastSearchedCity();

});