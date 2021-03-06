angular.module('watchout.tvshow-services', [])

.factory('TVGenres', function(){
    var tvGenres = [];
   var selectedTVGenres = [];
 return {
  init : function(scope) {
    tvGenres = [];
    theMovieDb.genres.getList({}, 
      function(data) {
        var parsedData = JSON.parse(data);
        tvGenres = parsedData.genres;
        if(scope) {          
          scope.tvGenres = all();
          scope.hideSpinner();
        }
      },  
      function(error){
        // console.log('Error CB');
        // console.log(error);
      });
  },
  all: function() {
    //// console.log("all()");
    return tvGenres;
  },
  get: function(tvGenreId) {
      for (var i = 0; i < tvGenres.length; i++) {
        if(tvGenres[i].id == tvGenreId) {
          return tvGenres[i];
        }
      }

      return null;
  },
  remove: function(tvGenre) {
    tvGenres.splice(tvGenres.indexOf(tvGenre), 1);
  },
  saveFavoriteGenres: function(selectedGenres) {
    selectedTVGenres = selectedGenres;
    for (var i = 0; i < tvGenres.length; i++) {
        for (var j=0; j< selectedTVGenres.length; j++) {
          if(tvGenres[i].id == selectedTVGenres[j].id) {
            tvGenres[i].checked = true;
            // console.log(tvGenres[i]);
          }
      }
    }
  },
  getFavouriteGenres: function(){
    return selectedTVGenres;
  }
 };
})

.factory('TVShowDetail', ['TVGenres', 'Configurations', function(TVGenres, Configurations){
  var tvShowDetail ;
  var savedShowMetaData;
  var isLoading = false;
return {
    init : function() {
        var genres = TVGenres.all();
        if(genres.length == 0) {
          TVGenres.init();// init without scope to use genres later
        }
        
    },
    setMetaData : function(metaData) {
      savedShowMetaData = metaData;
      // set from metadata
      if(tvShowDetail && savedShowMetaData && !isObjectEmpty(savedShowMetaData)){
        newTvShow.isFavourite = savedShowMetaData.is_favourite == FLAG_STRING_YES;
      }
    },
    loadTvShowDetailCallBack : function(scope, tvShowId) {
      return function() {
        var config = Configurations.getConfigurations();
        if(!isLoading) {
        isLoading = true;
        // console.log(isLoading);
        theMovieDb.tv.getById({id: tvShowId },
        function(data) {
          // console.log(typeof data)
          var newTvShow = JSON.parse(data);
          // change the poster path
          var relativeImageURL = newTvShow.poster_path;
          // console.log(newTvShow);
          if(relativeImageURL) {
              if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                relativeImageURL = config.images.base_url 
                                    + config.images.poster_sizes[0]
                                    + relativeImageURL;
                newTvShow.poster_path = relativeImageURL;
                // console.log(relativeImageURL);
              }
          } else {
            newTvShow.poster_path = FALL_BACK_IMAGE_PARH;
          }
          // change the backdrop path
          relativeImageURL = newTvShow.backdrop_path;
          if(relativeImageURL) {
            // console.log(relativeImageURL);
            if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                relativeImageURL = config.images.base_url  
                                    + config.images.backdrop_sizes[0]
                                    + relativeImageURL;
                newTvShow.backdrop_path = relativeImageURL;
                // console.log(relativeImageURL);
              }
          } else {
            newTvShow.backdrop_path = FALL_BACK_IMAGE_PARH;
          }
          // add genre names
          var genres = newTvShow.genres;
          var tvShowGenreLabels = '';
          for(var index in genres) {              
              if(tvShowGenreLabels.length > 0) {
                tvShowGenreLabels += ',';
              }
              tvShowGenreLabels += genres[index].name;
          }
          // set it to list item 
          newTvShow.show_genre_labels = tvShowGenreLabels;
          // set from metadata
          if(savedShowMetaData && !isObjectEmpty(savedShowMetaData)){
            newTvShow.isFavourite = savedShowMetaData.is_favourite == FLAG_STRING_YES;
          }
          // console.log(tvShowGenreLabels);
          newTvShow.first_air_date = new Date(newTvShow.first_air_date).toDateString();
          newTvShow.last_air_date = new Date(newTvShow.last_air_date).toDateString();

          scope.tvShow = newTvShow;
          
          scope.hideSpinner();
          isLoading = false;
        },
        function(error) {
          // console.log("Error CB");
          // console.log(error);
          isLoading = false;
        });
      }
      };
    },
    loadTvShowDetail : function(scope, tvShowId) {
      // console.log('in loadTvShows');
      var config = Configurations.getConfigurations();
      // console.log(config);
      if(!config) {
        Configurations.init(this.loadTvShowDetailCallBack(scope, tvShowId));
      } else {
        // console.log('in else');
        this.loadTvShowDetailCallBack(scope, tvShowId)();
        // call the function returned by the call back function
      }
      
    }
  };

}])

.factory('TVShowSearch', ['TVGenres', 'Configurations', function(TVGenres, Configurations){
  var tvShows = [];
  var currentPage = 0;
  var totalPages = 0;
  
  var isLoading = false;
  
  // console.log(Configurations.getConfigurations());
  var discoverWithAttributes = {
    'query' : '',
    'include_adult' : true,
    'sort_by' : 'popularity.desc',
    'page' : currentPage
  };
return {
    init : function(scope) {
      // initialize if the tvShows list
      if(tvShows.length == 0) {
         currentPage = 0;
        var genres = TVGenres.all();
        if(genres.length == 0) {
          TVGenres.init();// init without scope to use genres later
        }
      }
       
      // this.loadTvShows(scope, currentPage);
        
    },
    loadTvShowsCallBack : function(scope, pagetoLoad) {
      return function() {
        var config = Configurations.getConfigurations();
        var genres = TVGenres.all();
        if(!isLoading) {
        isLoading = true;
        // console.log(isLoading);
        theMovieDb.search.getTv(discoverWithAttributes,
        function(data) {
          // console.log(typeof data)
          var parsedData = JSON.parse(data);
          // console.log(parsedData.results);
          var newTvShowsPage = parsedData.results;
          for( var index in newTvShowsPage) {
            var newTvShow = newTvShowsPage[index];
            // change the poster path
            var relativeImageURL = newTvShow.poster_path;
            // console.log(newTvShow);
            if(relativeImageURL) {
                if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                  relativeImageURL = config.images.base_url 
                                      + config.images.poster_sizes[0]
                                      + relativeImageURL;
                  newTvShow.poster_path = relativeImageURL;
                  // console.log(relativeImageURL);
                }
            } else {
              newTvShow.poster_path = FALL_BACK_IMAGE_PARH;
            }
            // change the backdrop path
            relativeImageURL = newTvShow.backdrop_path;
            if(relativeImageURL) {
              // console.log(relativeImageURL);
              if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                  relativeImageURL = config.images.base_url  
                                      + config.images.backdrop_sizes[0]
                                      + relativeImageURL;
                  newTvShow.backdrop_path = relativeImageURL;
                  // console.log(relativeImageURL);
                }
            } else {
              newTvShow.backdrop_path = FALL_BACK_IMAGE_PARH;
            }
            newTvShow.first_air_date = new Date(newTvShow.first_air_date).toDateString();
            
            // add genre names
            var tvShowGenreIds  = newTvShow.genre_ids;
            var tvShowGenreLabels = '';
            for(var index in genres) {
              if(tvShowGenreIds.indexOf(genres[index].id) != -1) {
                if(tvShowGenreLabels.length > 0) {
                  tvShowGenreLabels += ',';
                }
                tvShowGenreLabels += genres[index].name;
              }
            }
            // set it to list item 
            newTvShow.show_genre_labels = tvShowGenreLabels;
            // console.log(tvShowGenreLabels);
          }
          tvShows = tvShows.concat(newTvShowsPage);
          // console.log(tvShows);
          scope.tvShows = tvShows;
          scope.hideSpinner();
          isLoading = false;
          currentPage = pagetoLoad + 1;
          totalPages = parsedData.total_pages;
          scope.$broadcast('scroll.infiniteScrollComplete');
        },
        function(error) {
          // console.log("Error CB");
          // console.log(error);
          isLoading = false;
        });
      }
      };
    },
    loadTvShows : function(scope, pagetoLoad, queryString) {
      if(discoverWithAttributes.query != queryString) {
        discoverWithAttributes.query = queryString;
        // check whether the query is changes to rest the currentPage
        tvShows =[];
        pagetoLoad = 0;// to get page 1
      }
      discoverWithAttributes.page = pagetoLoad + 1;

      // console.log('in loadTvShows');
      var config = Configurations.getConfigurations();
      // console.log(config);
      if(!config) {
        Configurations.init(this.loadTvShowsCallBack(scope, pagetoLoad));
      } else {
        // console.log('in else');
        this.loadTvShowsCallBack(scope, pagetoLoad)();
        // call the function returned by the call back function
      }
      
    },
    loadMore : function(scope, queryString) {
      this.init();
      // console.log("in loadMore");
      this.loadTvShows(scope, currentPage, queryString);
    },
    isEndOfResults : function() {
      if(totalPages != 0 ) {
        return totalPages == currentPage;
      }
      return true;
    },
    all: function() {
      return tvShows;
    },
    remove: function(tvShow) {
      tvShows.splice(tvShows.indexOf(tvShow), 1);
    },
    get: function(tvShowId) {
      for (var i = 0; i < tvShows.length; i++) {
        if (tvShows[i].id === parseInt(tvShowId)) {
          return tvShows[i];
        }
      }
      return null;
    }
  };

}])


.factory('TVShowSeasons', ['Configurations', function(Configurations){
    var tvShowSeasons = {};
    var savedSeasonMetaData;
    var currentInputParams={};
    var isLoading = false;
 return {
  init : function(showId, scope) {
    tvShowSeasons = {};
    var config = Configurations.getConfigurations();
    if(!config) {
      Configurations.init(this.loadTVShowSeasonsCallBack(showId, scope));
    } else {
      this.loadTVShowSeasonsCallBack(showId,scope)();
    }
  },
  setMetaData : function(metaData) {
    savedSeasonMetaData = metaData;
    if(tvShowSeasons.seasons) {
      for(var index in tvShowSeasons.seasons) {
        var tvShowSeason = tvShowSeasons.seasons[index];
        if(tvShowSeason.air_date) {
          tvShowSeason.air_date = new Date(tvShowSeason.air_date).toDateString();
        } 
        // get watched episodes count
        tvShowSeason.watched_episodes_count = 0;
        if(savedSeasonMetaData && savedSeasonMetaData[tvShowSeason.season_number]) {
          tvShowSeason.watched_episodes_count = savedSeasonMetaData[tvShowSeason.season_number].watchedcount;
        }            
      }
    }
  },
  loadTVShowSeasonsCallBack : function(showId,scope) {
    return function() {
    if(!isLoading) {
      isLoading = true;
      currentInputParams = {id: showId};
      theMovieDb.tv.getById(currentInputParams, 
      function(data) {        
        tvShowSeasons = JSON.parse(data);
        var config = Configurations.getConfigurations();
        // console.log(config);
        if(config) {
            var relativeImageURL = tvShowSeasons.backdrop_path;
            if(relativeImageURL) {
              tvShowSeasons.backdrop_path = config.images.base_url 
                                            + config.images.backdrop_sizes[0]
                                            + relativeImageURL;
            } else {
              newTvShow.backdrop_path = FALL_BACK_IMAGE_PARH;
            }
           //  // console.log(relativeImageURL);
            relativeImageURL = tvShowSeasons.poster_path;
            if(relativeImageURL) {
              tvShowSeasons.poster_path = config.images.base_url 
                                          + config.images.poster_sizes[0]
                                          + relativeImageURL;
            } else {
              newTvShow.poster_path = FALL_BACK_IMAGE_PARH;
            }
            // console.log(relativeImageURL);
        }
        if(tvShowSeasons.genres) {
          var genres_label = '';
          for(var i = 0;i<tvShowSeasons.genres.length; i++) {
            if(genres_label.length > 0){
              genres_label += ", ";
            }
            genres_label += tvShowSeasons.genres[i].name;
          }
          // console.log(genres_label);
          tvShowSeasons.show_genre_labels = genres_label;
        }
        if(tvShowSeasons.created_by) {
          var creatorsLabel = '';
          for(var index in tvShowSeasons.created_by) {
            if(index != 0) {
              creatorsLabel +=", ";
            }
            creatorsLabel += tvShowSeasons.created_by[index].name;
          }
          tvShowSeasons.creators_label = creatorsLabel;
        }
        if(tvShowSeasons.networks) {
          var networksLabel = '';
          for(var index in tvShowSeasons.networks) {
            if(index != 0) {
              networksLabel +=", ";
            }
            networksLabel += tvShowSeasons.networks[index].name;
          }
          tvShowSeasons.networks_label = networksLabel;
        }
        if(tvShowSeasons.first_air_date) {
          tvShowSeasons.first_air_date = new Date(tvShowSeasons.first_air_date).toDateString();
        }
        if(tvShowSeasons.last_air_date) {
          tvShowSeasons.last_air_date = new Date(tvShowSeasons.last_air_date).toDateString();
        }
        if(tvShowSeasons.seasons) {
          for(var index in tvShowSeasons.seasons) {
            var tvShowSeason = tvShowSeasons.seasons[index];
            if(tvShowSeason.air_date) {
              tvShowSeason.air_date = new Date(tvShowSeason.air_date).toDateString();
            } 
            // get watched episodes count
            tvShowSeason.watched_episodes_count = 0;
            if( savedSeasonMetaData && savedSeasonMetaData[tvShowSeason.season_number]) {
              tvShowSeason.watched_episodes_count = savedSeasonMetaData[tvShowSeason.season_number].watchedcount;
            }            
          }
        }
        if(scope) {       
          // console.log(tvShowSeasons);   
          scope.tvShowSeasons = tvShowSeasons;
          scope.hideSpinner();
        }
        isLoading = false;
      }, 
      function(error){
        // console.log('Error CB');
        // console.log(error);
        isLoading = false;
      });
    }
    };
  },
  get: function(showId) {
    if(showId != currentInputParams.showId) {
      tvShowSeasons = {};
    }
    return tvShowSeasons;
  }
};
}])

.factory('TVShowEpisodes', ['Configurations', function(Configurations){
    var tvShowEpisodes = {};
    var savedEpisodesMetaData;
    var currentInputParams ={};
    var isLoading = false;
 return {
  init : function(showId,seasonNumber,episodeNumber, scope) {
    tvShowEpisodes = {};
    var config = Configurations.getConfigurations();
    if(!config) {
      Configurations.init(this.loadTVShowEpisodesCallBack(showId, seasonNumber,episodeNumber, scope));
    } else {
      this.loadTVShowEpisodesCallBack(showId, seasonNumber,episodeNumber, scope)();
    }
  },
  setMetaData : function(metaData) {
    savedEpisodesMetaData = metaData;
  },
  loadTVShowEpisodesCallBack : function(showId,seasonNumber,episodeNumber,scope) {
    return function() {
    if(!isLoading) {
      isLoading = true;
      currentInputParams = {id: showId, season_number: seasonNumber};
      theMovieDb.tvSeasons.getById(currentInputParams, 
      function(data) {        
        tvShowEpisodes = JSON.parse(data);
        // console.log(tvShowEpisodes);
        var config = Configurations.getConfigurations();
        // console.log(config);
        if(config) {
            var relativeImageURL = tvShowEpisodes.poster_path;
            if(relativeImageURL) {
              tvShowEpisodes.poster_path = config.images.base_url 
                                          + config.images.poster_sizes[0]
                                          + relativeImageURL;
              tvShowEpisodes.poster_path = relativeImageURL;
            } else {
              tvShowEpisodes.poster_path = FALL_BACK_IMAGE_PARH;
            }
            // console.log(relativeImageURL);
        }
        if(tvShowEpisodes.air_date) {
          tvShowEpisodes.air_date = new Date(tvShowEpisodes.air_date).toDateString();
        }
        if(tvShowEpisodes.episodes){
          for(var index in tvShowEpisodes.episodes) {
            var episode = tvShowEpisodes.episodes[index];
            if(savedEpisodesMetaData && savedEpisodesMetaData[episode.episode_number]) {
              episode.air_date = new Date(episode.air_date).toDateString();
              episode.isWatched = savedEpisodesMetaData[episode.episode_number].isWatched == FLAG_STRING_YES;
            }
          }
        }
        
        if(scope) {       
          // console.log(tvShowEpisodes);   
          scope.tvShowEpisodes = tvShowEpisodes;
          if(episodeNumber) {
            scope.goToEpisode(episodeNumber);
          }
          scope.hideSpinner();
        }
        isLoading = false;
      }, 
      function(error){
        // console.log('Error CB');
        // console.log(error);
        isLoading = false;
      });
    }
    };
  },
  get: function(showId,seasonNumber,episodeNumber) {
    if(showId != currentInputParams.showId || seasonNumber != currentInputParams.seasonNumber) {
      tvShowEpisodes = {};
    }
    return tvShowEpisodes;
  }
};
}])

.factory('TVShowEpisodeDetail', ['Configurations', function(Configurations){
    var tvShowEpisodeDetail = {};
    var savedEpisodeMetaData = {};
    var currentInputParams = {};
    var validScope;
    var isLoading = false;
 return {
  init : function(showId,seasonNumber, episodeNumber, scope) {
    tvShowEpisodeDetail = {};
    var config = Configurations.getConfigurations();
    // console.log('in TVShowEpisodeDetail init()');
    if(!config) {
      Configurations.init(this.loadTVShowEpisodeDetailCallBack(showId, seasonNumber, episodeNumber, scope));
    } else {
      this.loadTVShowEpisodeDetailCallBack(showId, seasonNumber,episodeNumber, scope)();
    }
  },
  setMetaData : function(metaData) {
    savedEpisodeMetaData = metaData;
  },
  loadTVShowEpisodeDetailCallBack : function(showId,seasonNumber,episodeNumber,scope) {
    return function() {
    if(!isLoading) {
      isLoading = true;
      currentInputParams = {id: showId, season_number: seasonNumber, episode_number : episodeNumber};
      theMovieDb.tvEpisodes.getById(currentInputParams, 
      function(data) {        
        tvShowEpisodeDetail = JSON.parse(data);
        // console.log(tvShowEpisodeDetail);
        var config = Configurations.getConfigurations();
        // console.log(config);
        if(config) {
            var relativeImageURL = tvShowEpisodeDetail.still_path;
            if(relativeImageURL) {
              tvShowEpisodeDetail.still_path = config.images.base_url 
                                            + config.images.still_sizes[1]
                                            + relativeImageURL;
            } else {
              tvShowEpisodeDetail.still_path = FALL_BACK_IMAGE_PARH;
            }
           // console.log(relativeImageURL);
        }
        if(tvShowEpisodeDetail.air_date) {
          var airedDate = new Date(tvShowEpisodeDetail.air_date);
          tvShowEpisodeDetail.air_date = airedDate.toDateString();
          tvShowEpisodeDetail.isAired = airedDate.getTime() 
                                        - (new Date()).getTime() < 0;
          // console.log(tvShowEpisodeDetail.isAired);
        }
        if(savedEpisodeMetaData.id) {
          tvShowEpisodeDetail.alertEnabled = savedEpisodeMetaData.alertEnabled == FLAG_STRING_YES;
          tvShowEpisodeDetail.isFavourite = savedEpisodeMetaData.isFavourite == FLAG_STRING_YES;
          tvShowEpisodeDetail.isWatched = savedEpisodeMetaData.isWatched == FLAG_STRING_YES;
          tvShowEpisodeDetail.isAlerted = savedEpisodeMetaData.isAlerted == FLAG_STRING_YES;
          tvShowEpisodeDetail.alertDate = savedEpisodeMetaData.alertDate;
        }
        if(scope) {  
          validScope = scope;
        }
        // console.log(tvShowEpisodeDetail); 
        if(validScope) {  
          validScope.tvShowEpisodeDetail = tvShowEpisodeDetail;
          validScope.hideSpinner();
        }
        isLoading = false;
      }, 
      function(error){
        // console.log('Error CB');
        // console.log(error);
        isLoading = false;
      });
    }
    };
  },
  get: function(showId, seasonNumber,episodeNumber,scope) {
    if(showId != currentInputParams.showId 
        || seasonNumber != currentInputParams.seasonNumber 
        || episodeNumber != currentInputParams.episodeNumber) {
      tvShowEpisodeDetail = {};
    } else if(scope){
      validScope = scope;
    }
    return tvShowEpisodeDetail;
  }
};
}])

.factory('TVShows',  ['TVGenres', 'Configurations', function(TVGenres, Configurations){
  var tvShows = [];
  var currentPage = 0;
  var isLoading = false;
  var myGenres = TVGenres.getFavouriteGenres();
  var myGenreString = '';
  if(myGenres && myGenres.length > 0) {
    for(var index = 0; index < myGenres.length; index++) {
      if(index != 0){
        myGenreString +="|";
      }
      myGenreString += myGenres[index].id;
    }
    // console.log("myGenreString = " +myGenreString);
  } else {
    myGenreString ='10765|9648|18|35';
  }
  // console.log(Configurations.getConfigurations());
  var discoverWithAttributes = {
    'with_genres' : myGenreString,
    'include_adult' : true,
    'sort_by' : 'popularity.desc',
    'page' : currentPage
  };
return {
    init : function() {
      // initialize if the tv shows list
      if(tvShows.length == 0) {
         currentPage = 0;
        var genres = TVGenres.all();
        if(genres.length == 0) {
          TVGenres.init();// init without scope to use genres later
        }
      }
       
      // this.loadTVShows(scope, currentPage);
        
    },
    reset : function(){
      tvShows = [];
      this.init();
    },
    loadTVShowsCallBack : function(scope, pagetoLoad) {
      return function() {
        if(!isLoading) {
          isLoading = true;
          var genres = TVGenres.all();
          theMovieDb.discover.getTvShows(discoverWithAttributes,
          function(data) {
            var config = Configurations.getConfigurations();
            // console.log(typeof data)
            var parsedData = JSON.parse(data);
            // console.log(parsedData.results);
            var newShowsPage = parsedData.results;
            for( var index in newShowsPage) {
              var newTVShow = newShowsPage[index];
              // change the poster path
              var relativeImageURL = newTVShow.poster_path;
              // console.log(newTVShow);
              if(relativeImageURL) {
                  if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                    relativeImageURL = config.images.base_url 
                                        + config.images.poster_sizes[0]
                                        + relativeImageURL;
                    newTVShow.poster_path = relativeImageURL;
                    // console.log(relativeImageURL);
                  }
              } else {
                newTVShow.poster_path = FALL_BACK_IMAGE_PARH;
              }
              // change the backdrop path
              relativeImageURL = newTVShow.backdrop_path;
              if(relativeImageURL) {
                // console.log(relativeImageURL);
                if(relativeImageURL.indexOf(config.images.base_url) != 0) {
                    relativeImageURL = config.images.base_url  
                                        + config.images.backdrop_sizes[0]
                                        + relativeImageURL;
                    newTVShow.backdrop_path = relativeImageURL;
                    // console.log(relativeImageURL);
                  }
              } else {
                newTVShow.backdrop_path = FALL_BACK_IMAGE_PARH;
              }
              
              // add genre names
              var tvShowGenreIds  = newTVShow.genre_ids;
              var tvShowGenreLabels = '';
              for(var index in genres) {
                if(tvShowGenreIds.indexOf(genres[index].id) != -1) {
                  if(tvShowGenreLabels.length > 0) {
                    tvShowGenreLabels += ', ';
                  }
                  tvShowGenreLabels += genres[index].name;
                }
              }
              // set it to list item 
              newTVShow.show_genre_labels = tvShowGenreLabels;
              newTVShow.first_air_date = new Date(newTVShow.first_air_date).toDateString();
              // console.log(tvShowGenreLabels);
            }
            tvShows = tvShows.concat(newShowsPage);
            // console.log(tvShows);
            scope.tvShows = tvShows;
            scope.hideSpinner();
            isLoading = false;
            currentPage = pagetoLoad + 1;
            scope.$broadcast('scroll.infiniteScrollComplete');
          },
          function(error) {
            isLoading = false;
            // console.log("Error CB");
            // console.log(error);
          });
        }
      };
    },
    loadTVShows : function(scope, pagetoLoad) {
      discoverWithAttributes.page = pagetoLoad + 1;
      var config = Configurations.getConfigurations();
      if(!config) {
        Configurations.init(this.loadTVShowsCallBack(scope, pagetoLoad));
      } else {
        this.loadTVShowsCallBack(scope, pagetoLoad)();
        // call the function that is returned by the function
      }
    },
    loadMore : function(scope) {
      this.init();
      this.loadTVShows(scope, currentPage);
    },
    all: function() {
      return tvShows;
    },
    remove: function(tvShow) {
      movies.splice(tvShows.indexOf(tvShow), 1);
    },
    get: function(showId) {
      for (var i = 0; i < tvShows.length; i++) {
        if (tvShows[i].id === parseInt(showId)) {
          return tvShows[i];
        }
      }
      return null;
    }
  };

}]);
