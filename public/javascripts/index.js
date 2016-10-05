
$(document).ready(function () {
    // Add smooth scrolling to all links in navbar + footer link
    $(".navbar a, footer a[href='#myPage']").on('click', function (event) {
        
        
        
        // Store hash
        var hash = this.hash;
        console.log("hash",hash);
        // Using jQuery's animate() method to add smooth page scroll
        // The optional number (900) specifies the number of milliseconds it takes to scroll to the specified area
        if ($(hash).length) {
            
            // Prevent default anchor click behavior
            event.preventDefault();

            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 900, function () {
                
                // Add hash (#) to URL when done scrolling (default click behavior)
                window.location.hash = hash;
            });
        }
    });
    
    // Slide in elements on scroll
    $(window).scroll(function () {
        $(".slideanim").each(function () {
            var pos = $(this).offset().top;
            
            var winTop = $(window).scrollTop();
            if (pos < winTop + 600) {
                $(this).addClass("slide");
            }
        });
    });
})