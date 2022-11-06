$(function() {
    
    var header = $("#header"),
        introH = $("#intro").innerHeight(),
        scrollOffset = $(window).scrollTop();

    // Fixed header
    checkScroll(scrollOffset);

    $(window).on("scroll", function() {
        
        scrollOffset = $(this).scrollTop();
        checkScroll(scrollOffset);
        
    });

    function checkScroll(){

        if ( scrollOffset >= introH - 10) {
            header.addClass("fixed");
        } else {
            header.removeClass("fixed")
        }

    }


    // Smooth scroll
    $("[data-scroll]").on("click", function(event) {
        event.preventDefault();

        var $this = $(this),
            blockId = $(this).data('scroll'),
            blockOffset = $(blockId).offset().top;


        $("#nav a").removeClass("active");
        $this.addClass("active");
        $("#nav").removeClass("active");
        $("#nav_toggle").removeClass("active");
        $("#but_RMQ").removeClass("active");


        $("html, body").animate({
            scrollTop: blockOffset
        }, 500);

    });

    // Menu nav toggle
    $("#nav_toggle").on("click", function(event){
        event.preventDefault();

        $(this).toggleClass("active");
        $("nav").toggleClass("active");
    });
});