jQuery(document).ready(function ($) {
    $(".clickable-row").click(function () {
        window.document.location = $(this).data("href");
    });
});

.clickable-row(data-href='/profile/'+item.elderlyid._id)