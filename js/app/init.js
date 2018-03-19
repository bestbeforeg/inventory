function start(){ 
	var jqxhr = $.getJSON('./js/app/inventory.json')
	.done(function(data) {
	  console.log( "loaded" );
		categories = data;
		sortItems();
		items = [];
		createCatTree();
	});
};

