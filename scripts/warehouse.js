	jQuery(document).ready(function($) {		
		let categories,
				items = [];

		//get information from json and when done create sidemenu
		var jqxhr = $.getJSON('./scripts/app/inventory.json')
		.done(function(data) {
	    console.log( "loaded" );
			categories = data;
			createCatTree();
	  });

	  $('#sideMenu, #subcategoryInfo').on('click', 'li', function(event) {
	  	event.preventDefault();
	  	event.stopPropagation();
			let id = Number( $(this).attr('class').replace('class_', ''));
			let obj = categories[id];
	  	displayInfo(obj);
	  });

		//create category elements
		$('#addCategory').on('submit', function(event) {
			event.preventDefault();
			createCategoryEntry();
		});

		$('#addDetails button').on('click', function(event) {
			event.preventDefault();
			addDetails();
		});

		//set date of item, if "get current date is checked" sets input value to zero (if value is zero createDate sets the date to current date)
		$('#getCurrentDate').on('change', function(event) {
			event.preventDefault();
			if(this.checked)
			  $('dateIn').val('');
		});

		//toggle menu items visibility
		$('#sideMenu').on('click', '.expand', function(event) {
			event.preventDefault();
			if($(this).text() === '+')
				$(this).text('-');
			else
				$(this).text('+');
			$(this).siblings('.submenu').slideToggle();
		});

		//delete items from collection
		$('#itemList').on('click', '.deleteItem', function(event) {
			event.preventDefault();
			let index = $(this).parent('li').index();
			$(this).parent('li').remove();
			items.splice(index, 1);
			console.log(items);
			console.log(index);
		});

		//display info of category
		function displayInfo( obj ){
			$('#addNew h2').text(`#${obj.id} ${obj.name}`);
			let selected;
			if(obj.type === 'category')
				selected = '#catParent option[value=' + obj.id + ']';
			else
				selected = '#catParent option[value=' + obj.parent + ']';
			
			$('#catParent option').removeAttr('selected');
			$(selected).attr('selected','selected');
			
			// $('#catParent').
			if(obj.type === 'category'){
				$('#subcategoryInfo').html( $('<ul>') );
				printCategory(obj);
			}
			else{
				$('#subcategoryInfo').html('');
				printCollection(obj);
			}
		};

		function printCollection (obj) {		
			let table = '<table>\n\t<tr><th>Document in</th><th>Quantity in</th><th>Price in</th><th>Date in</th><th>Document out</th><th>Quantity out</th><th>Price out</th><th>Date out</th><th>Total</th></tr>\n';
			for(let item of obj.items){
				let tr = `\t<tr><td>${checkProperty(item, 'documentIn')}</td><td>${checkProperty(item, 'itemQuantity')}</td><td>${checkProperty(item, 'itemPrice')} </td><td>${checkProperty(item, 'dateIn')}</td><td>${checkProperty(item, 'documentOut')}</td><td>${checkProperty(item, 'itemQuantityOut')}</td><td>${checkProperty(item, 'itemPriceOut')} </td><td>${checkProperty(item, 'dateOut')}</td><td>${checkProperty(item, 'total')}</td></tr>\n`;
				table += tr;
			}
			table += `<tr><td colspan="8">Total quantity:</td><td>${sumProperty(obj, 'itemQuantity', 'itemQuantityOut')}</td>`
			table += `<tr><td colspan="8">Total price:</td><td>${sumProperty(obj, 'total')} </td>`;
			table += '</table>';
			$('#subcategoryInfo').html(table);
		}

		function printCategory (obj) {
			for(let id of obj.items){
				let child = categories[id];
				createLiElement(child, '#subcategoryInfo ul');
				//use recursion to list all subcategories
				if (child.type === 'category' && child.items.length>0){
					printCategory(child);
				}
			};			
		}

		function sumProperty (obj, property, property2) {
			let total = 0;
			obj.items.forEach( (index, value) => total += index[property] );
			if(property2 !== undefined)
				obj.items.forEach( (index, value) => total -= index[property2] );
			return total;
		}

		//create html tree in sidemenu with elements from object
		function createCatTree(){
			//sort categories by name - can be extended further to a function which the user can set
			//leave this for now
			//categories = categories.sort((a,b) => a.parent - b.parent);

			//create li elements for all categories and append them to main ul in sidebar
			for (let item in categories) {
				createLiElement(categories[item],'#sideMenu');
			};

			//append subcategories to parents
			for (let item in categories) {
				if(categories[item].parent !== 0){
					appendToParent(categories[item]);
				}
			}

			//create parent select
			updateSelectParent();
		};

		function createCategoryEntry () {
			//set current category properties
			let catName = $('#catName').val(),
					catParent = Number($('#catParent').val()),
					catType = 'category';
					categoryId = Number($('#catId').val());
			if($('#catCollection').is(':checked'))
				catType = 'collection';

			//add children ids to parent items
			if(catParent !== 0)
				categories[catParent].items.push(categoryId);

			// create object
			let curCat = createCategoryObj(catName, categoryId, catType, Number(catParent), items);
			categories[categoryId] = {};
			categories[categoryId] = curCat;

			//send json and when finished create html from object
			$.ajax ({
				type: "POST",
				url: "./save_json.php",
				data: { data: JSON.stringify(categories) },
				success: function (data) {
					createLiElement(curCat, '#sideMenu');
					if(curCat.parent !== "") appendToParent(curCat);
						updateSelectParent();
						items = [];
					}
				});
			};

		function addDetails(){
			let itemQuantity = Number($('#itemQuantity').val()),
					itemPrice = Number($('#itemPrice').val()),
					documentIn = $('#documentIn').val(),
					dateIn = createDate($('#dateIn').val());

			let curItem = createCollectionObj(documentIn, itemQuantity, itemPrice, dateIn);
			items.push(curItem);

			let li = $('<li>').text(`Document: ${curItem.documentIn}, Quantity: ${curItem.itemQuantity}, Price: ${curItem.itemPrice}, Date in: ${curItem.dateIn}`);
			let deleteItem = $('<span>').addClass('deleteItem').text('-').appendTo(li);
			$('#itemList').append(li);
		};

		function createCategoryObj(name, id, type, parent, items){
			return {
				name: name,
				id: id,
				type: type,
				parent: parent,
				items: items
			}
		};

		function createCollectionObj(documentIn, itemQuantity, itemPrice, dateIn){
			return {
				documentIn: documentIn,
				itemQuantity: itemQuantity,
				itemPrice: itemPrice,
				dateIn: dateIn,
				documentOut: '',
				itemQuantityOut: 0,
				itemPriceOut: 0,
				dateOut: '',
				total: itemQuantity * itemPrice - (itemQuantityOut * itemPriceOut)
			}
		};

		function createDate(dateFormat){
			if(dateFormat === '')					
				return ( new Date().toJSON().slice(0,10).split('-').reverse().join('-') );
			else
				return dateFormatл.slice(0,10).split('-').reverse().join('-');
		};

		function createLiElement (category, selector) {
			let li = $('<li>').addClass('class_' + category.id).text(`#${category.id} ${category.name}`)
 			li.appendTo(selector);
		};

		function appendToParent	(item) {
			let parentEl = '.class_' + item.parent;
			let parentUl = '.class_' + item.parent + ' > ul.submenu';
			if( !($(parentUl).length) ){
				$('<ul>').addClass('submenu').appendTo( $(parentEl) );
				$('<span>').addClass('expand').text('-').prependTo( $(parentEl) )
			}

			let li = $('.class_' + item.id);
			$(parentUl).append (li);
		};

		function updateSelectParent(){		
			$('#catParent').empty();
			$('<option>').val('0').text('Select').attr('selected', 'selected').appendTo($('#catParent'));
			for (let item in categories) {
				$('<option>').val(categories[item].id).text(categories[item].name).appendTo($('#catParent'));
			};
		};

		function checkProperty(obj, prop){
			if(obj[prop])
				return obj[prop];
			else
				return '';
		}

	});