

var BookmarkApp = (function() {

  var addBookmark = function( key, title, url, imageurl, folder, tags ) {
    $(".row").append("<div id='"+key+"' class='bookmarkbox col-xs-6 col-sm-4'>\
                        <a href='"+url+"' target='_blank'>\
                          <img class='bookmarkbox-image' src='"+imageurl+"' alt='bookmark' height='149' width='244'> \
                        </a>\
                        <div class='bookmarkbox-options'>\
                          <a id='bookmarkbox-options-edit' edit-key='"+key+"' edit-url='"+url+"' edit-title='"+title+"' href='#'>\
                            <i class='fa fa-pencil-square-o'></i>\
                          </a>\
                          <a id='bookmarkbox-options-zoom' zoom-data='"+imageurl+"' href='#'>\
                            <i class='fa fa-expand'></i>\
                          </a>\
                          <a id='bookmarkbox-options-remove' remove-key='"+key+"' href='#'>\
                            <i class='fa fa-trash'></i>\
                          </a>\
                        </div>\
                      </div>");
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-zoom").on('click', imageZoom);
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-remove").on('click', removeBookmark);
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-edit").on('click', editBookmark);
  };


  var updateBookmark = function( key, title, url, imageurl, folder, tags ) {
    $("#"+key+" > a").attr("href", url);
    $("#"+key+" > a > .bookmarkbox-image").attr("src", imageurl);
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-zoom").attr("zoom-data", imageurl);
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-edit").attr("edit-url", url);
    $("#"+key+" > .bookmarkbox-options > #bookmarkbox-options-edit").attr("edit-title", title);
  }


  var imageZoom = function() {
    swal({
      showConfirmButton: false,
      width: 730,
      padding: 0,
      background: "url('"+$(this).attr('zoom-data')+"')",
      html: "<div style='height: 400px;'></div>"
    });
  }


  var removeBookmark = function() {
    var key = $(this).attr('remove-key');
    swal({
      title: 'Are you sure?',
      text: 'You are about to remove this bookmark.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#AEDEF4',
      cancelButtonColor: '#EA8282',
      confirmButtonText: 'Yes',
      closeOnConfirm: false
      },
      function() {
        $.ajax({
          type: 'post',
          url: '/api/remove',
          data: JSON.stringify({"key": key}),
          dataType: 'json',
          contentType: 'application/json',
          success: function (json) {
            if ( json.status === "success" ) {
              $(".row > #"+json.key).remove();
              swal({
                title: 'Bookmark removed!',
                type: 'success',
                showCancelButton: false,
                confirmButtonColor: '#AEDEF4',
                confirmButtonText: 'OK',
                closeOnConfirm: true
              });
            } else {
              console.log("Removing bookmark failed, reason: " + json.reason);
              swal({
                title: 'Failed',
                text: 'Oops.. Failed to remove bookmark',
                type: 'error',
                confirmButtonColor: '#AEDEF4'
              });
            }
          },  
          error: function () {
            swal({
              title: 'Failed',
              text: 'Oops.. Failed to remove bookmark',
              type: 'error',
              confirmButtonColor: '#AEDEF4'
            });
          }
        });
      }
    );
  }


  var editBookmark = function() {
    var key = $(this).attr('edit-key');
    var oldUrl = $(this).attr('edit-url');
    var oldTitle = $(this).attr('edit-title');
    swal({
      title: 'Edit bookmark',
      html: '<br>\
            <span class="sweetalert-popup-text">Name:</span>\
            <input class="sweet-alert-input" value="'+oldTitle+'" id="edit-bookmark-name">\
            <br>\
            <span class="sweetalert-popup-text">Address:</span>\
            <input class="sweet-alert-input" value="'+oldUrl+'" id="edit-bookmark-url">',
      showCancelButton: true,
      closeOnConfirm: false,
      confirmButtonColor: '#AEDEF4',
      cancelButtonColor: '#D0D0D0'
      },
      function() {
        if ( ($('#edit-bookmark-url').val().length > 0) && ($('#edit-bookmark-name').val().length > 0) ) {
          $.ajax({
            type: 'post',
            url: '/api/edit',
            data: JSON.stringify({"key": key, "title": $('#edit-bookmark-name').val(), "url": $('#edit-bookmark-url').val(), "folder":"", "tags":[]}),
            dataType: 'json',
            contentType: 'application/json',
            success: function (json) {
              if ( json.status === "success" ) {
                updateBookmark( key, json.title, json.url, json.imageurl, json.folder, json.tags );
                swal({
                  title: 'Bookmark modified!',
                  text: 'Yay! successfully modified bookmark.',
                  type: 'success',
                  confirmButtonColor: '#AEDEF4'
                });
              } else {
                console.log("Editing bookmark failed, reason: " + json.reason);
                swal({
                  title: 'Failed',
                  text: 'Oops.. Failed to edit bookmark',
                  type: 'error',
                  confirmButtonColor: '#AEDEF4'
                });
              }
            },  
            error: function () {
              swal({
                title: 'Failed',
                text: 'Oops.. Failed to edit bookmark',
                type: 'error',
                confirmButtonColor: '#AEDEF4'
              });
            }
          });
        } else {
          swal({
            title: 'Failed',
            text: "Can't save bookmark without url or title!",
            type: 'error',
            confirmButtonColor: '#AEDEF4'
          });
        }
      }
    );
  }

  return {

    init: function() {
      $(document).ready( function() {
        $.ajax({
          url: "/api/all",
          dataType: "json",
          data: {
            format: "json"
          },
          success: function(json) {
            if ( json.status != "failed" ) {
              for (var key in json) {
                addBookmark( key,
                             json[key].title, 
                             json[key].url, 
                             json[key].imageurl,
                             json[key].folder,
                             json[key].tags
                            );
              }
            }
          },
          error: function(err) {
            console.log("Error: unable to get /api/all");
          }
        });

        $("#menu-btn-add").click(function() {
          swal({
            title: 'Add bookmark',
            html: '<br>\
                  <span class="sweetalert-popup-text">Name:</span>\
                  <input class="sweet-alert-input" placeholder="example.com" id="add-bookmark-name">\
                  <br>\
                  <span class="sweetalert-popup-text">Address:</span>\
                  <input class="sweet-alert-input" placeholder="http://www.example.com/" id="add-bookmark-url">',
            showCancelButton: true,
            closeOnConfirm: false,
            confirmButtonColor: '#AEDEF4',
            cancelButtonColor: '#D0D0D0'
            },
            function() {
              if ( ($('#add-bookmark-url').val().length > 0) && ($('#add-bookmark-name').val().length > 0) ) {
                $.ajax({
                  type: 'post',
                  url: '/api/save',   
                  data: JSON.stringify({"title": $('#add-bookmark-name').val(), "url": $('#add-bookmark-url').val(), "folder":"", "tags":[]}),
                  dataType: 'json',
                  contentType: 'application/json',
                  success: function (json) {
                    if ( json.status === "success" ) {
                      addBookmark( json.key, json.title, json.url, json.imageurl, json.folder, json.tags );
                      swal({
                        title: 'Bookmark added!',
                        text: 'Yay! successfully added new bookmark.',
                        type: 'success',
                        confirmButtonColor: '#AEDEF4'
                      });
                    } else {
                      console.log("Adding bookmark failed, reason: " + json.reason);
                      swal({
                        title: 'Failed',
                        text: 'Oops.. Failed to add bookmark',
                        type: 'error',
                        confirmButtonColor: '#AEDEF4'
                      });
                    }
                  },  
                  error: function () {
                    swal({
                      title: 'Failed',
                      text: 'Oops.. Failed to add bookmark',
                      type: 'error',
                      confirmButtonColor: '#AEDEF4'
                    });
                  }
                });
              } else {
                swal({
                  title: 'Failed',
                  text: "Can't save bookmark without url or title!",
                  type: 'error',
                  confirmButtonColor: '#AEDEF4'
                });
              }
            }
          );
        });
      });
    }
    
  };
})();
BookmarkApp.init();
