// Toggle read more or read less when stuff is shown or collapsed

$('.story-collapse').on('shown.bs.collapse', function () {
  $(this).next("a").html("<p><i>Read Less...</i></p>");
});

$('.story-collapse').on('hidden.bs.collapse', function () {
  $(this).next("a").html("<p><i>Read More...</i></p>");
});