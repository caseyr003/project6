function AppViewModel() {
   // Set initial variables
   var self = this;
   this.searchText = ko.observable('');
   this.error = ko.observable('');
   this.locationArray = ko.observableArray([]);
   this.visibleArray = ko.observableArray([]);
   this.searchOpen = ko.observable(false);
   this.dataUnavailable = ko.observable(true);

   this.openSearch = function() {
      this.searchOpen(!this.searchOpen());
   };

   // Create new Location instance from location array items
   locations.forEach(function (location) {
      // Create new instance
      newLocation = new Location(location);
      // Create and save marker to created location
      newLocation.marker = createMarker(location.title, location.coordinates);
      // Add created location to arrays
      self.locationArray.push(newLocation);
      self.visibleArray.push(newLocation);
   });

   // Request Foursquare data for each location
   this.locationArray().forEach(function (location) {
      $.ajax({
         url: 'https://api.foursquare.com/v2/venues/' + location.id() + '?client_id=' + foursquare_id + '&client_secret=' + foursquare_secret +'&v=201701401&m=foursquare',
         dataType: 'json',
         success: function (data) {

            var result = data.response.venue;

            // Set to false to display Foursquare data
            self.dataUnavailable(false);

            // Save Foursquare address to location
            var address = result.hasOwnProperty('location') ? result.location : '';
            if (address.hasOwnProperty('address')) {
               location.address(address.address || 'n/a');
            }

            // Save Foursquare rating to location
            var rating = result.hasOwnProperty('rating') ? result.rating : '';
            location.rating(rating || 'n/a');

            // Save Foursquare likes to location
            var likes = result.hasOwnProperty('likes') ? result.likes : '';
            if (likes.hasOwnProperty('summary')) {
               location.likes(likes.summary || 'n/a');
            }

            // Save Foursquare photo url to location
            var photo = result.hasOwnProperty('bestPhoto') ? result.bestPhoto : '';
            if (photo.hasOwnProperty('prefix') && photo.hasOwnProperty('suffix')) {
               var photourl = photo.prefix + '300x300' + photo.suffix;
               location.photo(photourl || 'n/a');
            }

            // Save Foursquare url to location
            var url = result.hasOwnProperty('canonicalUrl') ? result.canonicalUrl : '';
            location.url(url || 'n/a');

            // Create info window html with Foursquare data once request is complete
            var contentString = '<div class="result-info">' +
                                    '<p class="result-title">' + location.title() + '</p>' +
                                    '<p class="result-address">' + location.address() + '</p>' +
                                    '<p class="result-rating">' + location.rating() + '</p>' +
                                    '<p class="result-likes">' + location.likes() + '</p>' +
                                    '<p><a class="result-url" href="' + location.url() + '" target="_blank">Learn more on Foursquare</a></p>' +
                                    '<p><img class="result-powered" src="img/foursquare-logo.png"></p>' +
                                '</div>';

            // Display info and animate marker when clicked
            location.marker.addListener('click', function() {
               // Connect info window with marker and set content
               info.open(map, location.marker);
               info.setContent(contentString);

               //Start bounce animation on marker
               location.marker.setAnimation(google.maps.Animation.BOUNCE);

               // Stop animation after 3 bounces
               setTimeout(function () {
                   location.marker.setAnimation(null);
               }, 2100);
            });
         },

         error: function (error) {

            // Create info window html without Foursquare data if error
            var contentString = '<div class="result-info">' +
                                    '<p class="result-title">' + location.title() + '</p>' +
                                    '<p class="result-address">Foursquare Data Not Available</p>' +
                                '</div>';

            // Display info and animate marker when clicked
            location.marker.addListener('click', function() {
               // Connect info window with marker and set content
               info.open(map, location.marker);
               info.setContent(contentString);

               //Start bounce animation on marker
               location.marker.setAnimation(google.maps.Animation.BOUNCE);

               // Stop animation after 3 bounces
               setTimeout(function () {
                  location.marker.setAnimation(null);
               }, 2100);
            });
         }
      });
   });

   // Filter markers with user input
   this.filteredMarkers = ko.computed(function () {

      // Save search in lowercase to compare to locations
      var search = self.searchText().toLowerCase();

      // Clear array containing visible markers
      self.visibleArray.removeAll();

      // Hide marker and add to visible array if matches search text
      self.locationArray().forEach(function (location) {

         // Hide marker
         location.marker.setVisible(false);

         // Add to visible array if matches search text
         if (location.title().toLowerCase().indexOf(search) > -1) {
            self.visibleArray.push(location);
         }
      });

      // If no results for search display error otherwise display results
      if (self.visibleArray().length === 0) {

         // Display no results error
         self.error('No Results');
      } else {

         // remove error message
         self.error('');
         self.visibleArray().forEach(function (location) {
            location.marker.setVisible(true);
         });
      }
   });

   // Center map on marker when selected from list
   this.getInfo = function(location) {
      google.maps.event.trigger(location.marker, 'click');
      map.panTo(location.marker.position);
      map.setZoom(14);
   };
}
