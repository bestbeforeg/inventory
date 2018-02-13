	jQuery(document).ready(function($) {		
		let categories, items;
		start();

		$('#sideMenu, #subcategoryInfo').on('click', 'li', function(event) {
			event.preventDefault();
			event.stopPropagation();
			let id = Number( $(this).attr('class'));
			let obj = categories[id];
			displayInfo(obj);
		});

		$('#edit').on('click', '.editDelete', function(event) {
			event.preventDefault();
			let id = $('#addNew').data('id');
			deleteItem(id);
		});

		$('#edit').on('click', '.editSave', function(event) {
			event.preventDefault();
			saveInfo();
		});

		$('#subcategoryInfo').on('click', 'ul li button.deleteItem', function(event){
			event.preventDefault();
			event.stopPropagation();
			let id = $(this).parent('li').attr('class');
			deleteItem(Number(id));
			$(this).parent('li').remove();
		});

		$('#subcategoryInfo').on('click', 'ul li button.editItem', function(event){
			event.preventDefault();
			event.stopPropagation();
			let id = $(this).parent('li').attr('class');
			displayInfo(categories[id])
			editEntry(categories[id]);
		});

		$('#subcategoryInfo').on('click', 'table td button.deleteItem', function(event){
			event.preventDefault();
			event.stopPropagation();
			let id = $('#addNew').data('id'),
					itemIndex = $(this).parent('td').parent('tr').index();

			categories[id].items.splice(itemIndex, 1);
			$(this).parent('td').parent('tr').remove();
		});

		//create category elements
		$('#addCategory').on('submit', function(event) {
			event.preventDefault();
			createCategoryEntry();
		});

		$('#details button').on('click', function(event) {
			event.preventDefault();
			addDetails();
		});

		//set date of item, if "get current date is checked" sets input value to zero (if value is zero createDate sets the date to current date)
		$('#getCurrentDate').on('change', function(event) {
			event.preventDefault();
			if($(this.checked)){
				$('#date').val('');
			}
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
		});

		$('#addNew').on('click', '.edit', function(event) {
			event.preventDefault();
			let id = $('#addNew').data('id');	
			editEntry( categories[id] );
		});

		//get information from json and when done create sidemenu
		function start(){ 
			var jqxhr = $.getJSON('./scripts/app/inventory.json')
			.done(function(data) {
			  console.log( "loaded" );
				categories = data;
				sortItems();
				items = [];
				createCatTree();
			});
		};

		function saveInfo () {
			let oldEntry = categories[$('#addNew').data('id')],
					curID = Number($('#catId').val());

			if(checkID(curID) && oldEntry.id != curID)
				return;

			//if ID is changed update it to all children
			if(oldEntry.id != curID){
				if(oldEntry.type === 'category' && oldEntry.items.length > 0){
					oldEntry.items.forEach( function(element, index) {
						categories[element].parent = curID;
					});
				};
				categories[oldEntry.parent].items = categories[oldEntry.parent].items.filter( elem => elem != oldEntry.id);
			};

			let curParent = Number($('#catParent').val());
			//if parent category is changed update parent
			if(oldEntry.parent != curParent && oldEntry.parent != 0)
					categories[oldEntry.parent].items = categories[oldEntry.parent].items.filter( elem => elem != oldEntry.id);

			if(oldEntry.parent != curParent && curParent != 0)
				categories[curParent].items.push(curID);

			oldEntry.parent = curParent;

			oldEntry.name = $('#catName').val();
			if(oldEntry.type === 'collection')
				oldEntry.items = oldEntry.items.concat(items);

			delete categories[oldEntry.id];
			oldEntry.id = curID;
			categories[curID] = oldEntry;
			sendData();
			displayInfo(categories[curID]);
		}

		function deleteItem(id){
			//remove id from parents if any
			console.log(id);
			if(categories[id].parent != 0){
				categories[categories[id].parent].items = categories[categories[id].parent].items.filter(index => index != Number(id));
			}

			if(categories[id].type !== 'collection'){
				categories[id].items.forEach( value =>  deleteItem(value));
			}

			delete categories[id];
			sendData();
		}

		//display info of category
		function displayInfo( obj ){
			$('#addNew h2').text(`#${obj.id} ${obj.name}`);
			$('#addNew').data('id', obj.id);
			$('#addNew button').remove();
			$('<button>').addClass('edit').text('Edit').insertAfter('#addNew h2');

			let	selected = '#catParent option[value=' + obj.parent + ']';
			
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
			let table = '<table>\n\t<thead><tr><th>Operation</th><th>Document</th><th>Price</th><th>Quantity</th><th>Date</th><th>From/To</th><th>Total Price</th></tr></thead>\n<tbody>';
			for(let item of obj.items){
				let tr = `\t<tr><td>${checkProperty(item, 'type')}</td><td>${checkProperty(item, 'document')}</td><td>${checkProperty(item, 'price')} </td><td>${checkProperty(item, 'quantity')}</td><td>${checkProperty(item, 'date')}</td><td>${checkProperty(item, 'counterparty')}</td><td>${checkProperty(item, 'total')}</td></tr>\n`;
				table += tr;
			}
			table += `</tbody>\n<tfoot><tr><td colspan="6">Total quantity:</td><td>${sumProperty(obj, 'quantity')}</td>`
			table += `<tr><td colspan="6">Total price:</td><td>${sumProperty(obj, 'total')} </td>`;
			table += '</tfoot></table>';
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

		function sumProperty (obj, property) {
			let total = 0;
			obj.items.forEach( function(index){
				if(index.type === 'ingoing') total += index[property]
				else total -= index[property]
			});

			return total;
		}

		//create html tree in sidemenu with elements from object
		function createCatTree(){
			//sort categories by name - can be extended further to a function which the user can set
			//leave this for now
			//categories = categories.sort((a,b) => a.parent - b.parent);

			//create li elements for all categories and append them to main ul in sidebar
			$('#sideMenu').empty();
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

			if(checkID(categoryId))
				return;

			if($('#catCollection').is(':checked'))
				catType = 'collection';

			//add children ids to parent items
			if(catParent !== 0)
				categories[catParent].items.push(categoryId);

			// create object
			let curCat = createCategoryObj(catName, categoryId, catType, Number(catParent), items);
			categories[categoryId] = {};
			categories[categoryId] = curCat;

			sendData();
		};

		function sendData(){
			console.log(categories)
			//send json and when finished create html from object
			sortItems();


			$.ajax ({
				type: "POST",
				url: "./save_json.php",
				data: { data: JSON.stringify(categories) },
				success: function(data){
					start();
				}
			});
		}

		function sortItems () {
			for(let item in categories){
				if (categories[item].type === 'collection'){
					categories[item].items = categories[item].items.sort(function (a, b) {

						let dateA = new Date(a.date.split('-').reverse().join('-'));
						let dateB = new Date(b.date.split('-').reverse().join('-'));

						return dateA - dateB
					});
				}
			}
		};

		function editEntry(obj){
			if(obj.type === 'collection')
				$('#details').prependTo('#edit');

			$('#catSelect').prependTo('#edit');
			$('#catName').val(obj.name);
			$('#catId').val(obj.id);
			$('#addNew').insertAfter('#catSelect');
			$('#addNew button').remove();

			if(obj.type === 'category'){
				$('<button>').addClass('editItem').text('Edit').appendTo('#subcategoryInfo ul li');
				$('<button>').addClass('deleteItem').text('Delete').appendTo('#subcategoryInfo ul li');
			}
			else{
				$('<th>').appendTo('#subcategoryInfo table thead tr');
				$('<td>').appendTo('#subcategoryInfo table tbody tr');
				$('<td>').appendTo('#subcategoryInfo table tfoot tr');
				$('#subcategoryInfo table tfoot td:first-child').attr('colspan', 7);
				$('<button>').addClass('deleteItem').text('Delete').appendTo('#subcategoryInfo table tbody td:last-child');	
			}
		};

		function addDetails(){
			let	itemType = $("input:radio[name ='itemType']:checked").val(),
					documentName = $('#document').val(),
					quantity = Number($('#quantity').val()),
					price = Number($('#price').val()),
					date = createDate($('#date').val()),
					counterparty = $('#counterparty').val();

			let curItem = createCollectionObj(itemType, documentName, quantity, price, date, counterparty);
			items.push(curItem);

			let li = $('<li>').text(`Type: ${curItem.type}, Document: ${curItem.document}, Quantity: ${curItem.quantity}, Price: ${curItem.price}, Date: ${curItem.date}, Counterparty: ${curItem.counterparty}, Total: ${curItem.total}`);
			let deleteItem = $('<span>').addClass('deleteItem').text('Delete').appendTo(li);
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

		function createCollectionObj(type, documentName, quantity, price, date, counterparty){
			return {
				type: type,
				document: documentName,
				quantity: quantity,
				price: price,
				date: date,
				counterparty: counterparty,
				total: quantity * price
			}
		};

		function createDate(dateFormat){
			if(dateFormat === '')					
				return ( new Date().toJSON().slice(0,10).split('-').reverse().join('-') );
			else
				return dateFormat.slice(0,10).split('-').join('-');
		};

		function createLiElement (category, selector) {
			let li = $('<li>').attr('class', category.id).text(`#${category.id} ${category.name}`)
 			li.appendTo(selector);
		};

		function appendToParent	(item) {
			let parentEl = '.' + item.parent;
			let parentUl = '.' + item.parent + ' > ul.submenu';
			if( !($(parentUl).length) ){
				$('<ul>').addClass('submenu').appendTo( $(parentEl) );
				$('<span>').addClass('expand').text('-').prependTo( $(parentEl) )
			}

			let li = $('#sideMenu .' + item.id);
			$(parentUl).append(li);
		};

		function updateSelectParent(){		
			$('#catParent').empty();
			$('<option>').val('0').text('None').attr('selected', 'selected').appendTo($('#catParent'));
			for (let item in categories) {
				if(categories[item].type === 'category')
					$('<option>').val(categories[item].id).text(categories[item].name).appendTo($('#catParent'));
			};
		};

		function checkProperty(obj, prop){
			if(obj[prop])
				return obj[prop];
			else
				return '';
		}

		function checkID(id) {
			return categories.hasOwnProperty(id);
		};
	});