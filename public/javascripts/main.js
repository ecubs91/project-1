$('#password_check').on('input',function(e){
    console.log('password check in progress');
    if ($('#password').val() != $('#password_check').val()){
    	$("#errormsg").show();
    }
});

$(document).ready(function(){
    $("#aboutus").click(function(){
        //console.log('about us clicked');
        $('html,body').animate({
            scrollTop: $("#abt").offset().top
        }, 1800);
    });

    $("#top").click(function(){
        $('html,body').animate({
            scrollTop: $("#aboutus").offset().top
        }, 1800);
    });

    $("#hide").click(function(){
        $("j").hide();
    });
    $("#show").click(function(){
        $("j").show();
    });
    $("#hide1").click(function(){
        $("k").hide();
    });
    $("#show1").click(function(){
        $("k").show();
    });
    $("#hide2").click(function(){
    	$("l").hide();
    });
    $("#show2").click(function(){
    	$("l").show();
    });
    $("#hide3").click(function(){
    	$("m").hide();
    });
    $("#show3").click(function(){
        $("m").show();
    });

    $('#math').click(function(){
        window.location.href='./resources?category=1';
    });

    $('#sciences').click(function(){
        window.location.href='./resources?category=2';
    });

    $('#humanities').click(function(){
        window.location.href='./resources?category=3';
    });

    $('#languages').click(function(){
        window.location.href='./resources?category=4';
    });




});