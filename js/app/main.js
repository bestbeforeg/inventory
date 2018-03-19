define(function (require) {

	jQuery(document).ready(function($) {		
		let categories, items;
		start();

		$('.start').on('click', function(event) {
			event.preventDefault();
			showStart();
		});

		$('#sideMenu, #subcategoryInfo').on('click', 'li', function(event) {
			event.preventDefault();
			event.stopPropagation();
			let id = Number( $(this).attr('class'));
			let obj = categories[id];
			displayInfo(obj);
		});

		$('.showSearch').on('click', function(event) {
			event.preventDefault();
			$('.searchCard').show();
		});

		$('#searchTerm').on('input', function(event) {
			event.preventDefault();
			search();
		});

		$('#searchDate').on('change', function(event) {
			event.preventDefault();
			$('#datesRange').toggle();
		});

		$('#catType').on('change', function(event) {
			event.preventDefault();
			$('#details').toggle();
		});		

		$('#searchResults ul').on('click', 'li', function(event) {
			event.preventDefault();
			let id = $(this).attr('class');
			$('#searchResults, .searchCard').hide();
			displayInfo(categories[id]);
		});

		$('#edit').on('click', '.editDelete', function(event) {
			event.preventDefault();
			let id = $('#addNew').data('id');
			deleteItem(id);
			showStart();
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
			showStart();
		});

		$('#details button').on('click', function(event) {
			event.preventDefault();
			addDetails();
		});

		//set date of item, if "get current date is checked" sets input value to zero (if value is zero createDate sets the date to current date)
		$('#getCurrentDate').on('change', function(event) {
			event.preventDefault();
			$('#setDate').toggle();
			if($(this).is(':checked')){
				$('#date').val('');
			}
		});

		//toggle menu items visibility
		$('#sideMenu').on('click', '.expand', function(event) {
			event.preventDefault();
			if($(this).text() === 'expand_more')
				$(this).text('chevron_right');
			else
				$(this).text('expand_more');
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
			var jqxhr = $.getJSON('./js/app/inventory.json')
			.done(function(data) {
				categories = data;
				sortItems();
				items = [];

				createCatTree();
			});
		};

		function showStart(){
			$('#addNew').prependTo('main')
			$('#addNew .mdl-card__title button').remove();
			$('#addNew h4').text('Create new category');
			$('#subcategoryInfo').empty();
			clearInputs();
			$('#details').prependTo('#addCategory');
			emptyItems();
			$('#catType').prependTo('#addCategory');
			$('#catSelect').prependTo('#addCategory');
			$('#catType label').removeClass('is-checked');
			$('#catType label').first().addClass('is-checked');
			$('#catCategory').prop('checked', true);
			$('.searchCard, #searchResults, #details, #edit').hide();
			$('#addCategory').show();
		}

		function clearInputs(){
			$('#catName').val('');
			$('#catId').val('');
			$('#document').val('');
			$('#quantity').val('');
			$('#price').val('');
			$('#counterparty').val('');
			updateSelectParent();
		}

		function changeIDtoParent (obj, newID, newParent) {
			//remove id from parant's items if mot zero
			if(obj.parent != 0){
				categories[obj.parent].items = categories[obj.parent].items.filter( elem => elem != obj.id);
			}

			//add new id to new parent's items if not zero
			if(newParent != 0)
				categories[newParent].items.push(newID);
		}

		function changeIDtoChildren(obj, newID){
			if(obj.type === 'category' && obj.items.length > 0){
					obj.items.forEach( function(element, index) {
					categories[element].parent = newID;
				});
			};
		}

		function saveInfo () {
			let oldEntry = categories[$('#addNew').data('id')],
					curID = Number($('#catId').val()),
					curParent = Number($('#catParent').val()),
					newItems = (items.length > 0) ? oldEntry.items.concat(items) : oldEntry.items;

			if(checkID(curID) && oldEntry.id != curID){
				alert('ID already exists!');
				return;
			}
			
			let newEntry = createCategoryObj($('#catName').val(), curID, oldEntry.type, curParent, newItems)

			if(oldEntry.id != curID){
				changeIDtoParent(oldEntry, curID, curParent);
				changeIDtoChildren(oldEntry, curID);
			}
			else if(oldEntry.parent != curParent)
				changeIDtoParent(oldEntry, curID, curParent);

			delete categories[oldEntry.id];
			categories[curID] = newEntry;
			emptyItems();
			sendData();			
			displayInfo(categories[curID]);
		}

		function emptyItems () {
			items = [];
			$('#itemList').empty();
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
			$('#addNew h4').text(`${obj.name} (ID: ${obj.id})`);
			$('#addNew').data('id', obj.id);
			$('#addNew button').remove();
			$('<button>').addClass('edit mdl-button mdl-js-button mdl-js-ripple-effect').text('Edit').insertAfter('#addNew h4');
			$('#addNew').prependTo('main')
			$('#addCategory').hide();
			$('#edit').hide();
			$('.searchCard, #searchResults').hide();

			let	selected = '#catParent option[value=' + obj.parent + ']';
			
			$('#catParent option').removeAttr('selected');
			$(selected).attr('selected','selected');
			
			// $('#catParent').
			if(obj.type === 'category'){
				$('#subcategoryInfo').html( $('<ul>').addClass('mdl-list') );
				printCategory(obj);
			}
			else{
				$('#subcategoryInfo').html('');
				printCollection(obj);
				highlightTable();
			}
		};

		function printCollection (obj) {		
			let table = '<table class="mdl-data-table mdl-js-data-table">\n\t<thead><tr><th>Operation</th><th>Document</th><th>Price</th><th>Quantity</th><th>Date</th><th>From/To</th><th>Total Price</th></tr></thead>\n<tbody>';
			for(let item of obj.items){
				let tr = `\t<tr><td>${checkProperty(item, 'type')}</td><td>${checkProperty(item, 'document')}</td><td>${checkProperty(item, 'price')} </td><td>${checkProperty(item, 'quantity')}</td><td>${checkProperty(item, 'date')}</td><td>${checkProperty(item, 'counterparty')}</td><td>${checkProperty(item, 'total')}</td></tr>\n`;
				table += tr;
			}
			table += `</tbody>\n<tfoot><tr><td colspan="6">Average price:</td><td>${calculateAverage(obj)}</td>`
			table += `<tr><td colspan="6">Total quantity:</td><td>${sumProperty(obj, 'quantity')}</td>`;
			table += '</tfoot></table>';
			$('#subcategoryInfo').html(table);
		}

		function highlightTable(){
			$('table.mdl-data-table tbody tr:contains(outgoing)').css({
				'background': '#ff4081',
				'color': '#fff'
			});
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

		function calculateAverage(obj){
			let totalPrice = 0,
					totalQuantity = 0;

			obj.items.forEach( function(index){
				if(index.type === 'ingoing'){
					totalPrice += index.total;
					totalQuantity += index.quantity;
				}
			});

			return (totalPrice / totalQuantity).toFixed(2);
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

			if(checkID(categoryId)){
				alert('ID already exists!');
				return;
			}

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
			//send json and when finished create html from object
			sortItems();
			$.ajax ({
				type: "POST",
				url: "./js/app/save_json.php",
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
			$('#addCategory').hide();
			$('.searchCard, #searchResults').hide();
			$('#edit').show();
			$('#details').show();
			if(obj.type === 'collection')
				$('#details').prependTo('#edit');
			else
				$('#details').appendTo('#addCategory');

			$('#catSelect').prependTo('#edit');
			$('#catName').val(obj.name);
			if($('#catName').val() != 0)
				$('#catName').parent('.mdl-textfield').addClass('is-focused');
			$('#catId').val(obj.id);
			if($('#catId').val() != 0)
				$('#catId').parent('.mdl-textfield').addClass('is-focused');
			$('#addNew').insertAfter('#catSelect');
			$('#addNew button').remove();


			if(obj.type === 'category'){
				$('<button>').addClass('editItem mdl-button mdl-js-button mdl-js-ripple-effect').text('Edit').appendTo('#subcategoryInfo ul li');
				$('<button>').addClass('deleteItem mdl-button mdl-js-button mdl-js-ripple-effect').text('Delete').appendTo('#subcategoryInfo ul li');
			}
			else{
				$('<th>').appendTo('#subcategoryInfo table thead tr');
				$('<td>').appendTo('#subcategoryInfo table tbody tr');
				$('<td>').appendTo('#subcategoryInfo table tfoot tr');
				$('#subcategoryInfo table tfoot td:first-child').attr('colspan', 6);
				$('<button>').addClass('deleteItem mdl-button mdl-js-button mdl-js-ripple-effect').text('Delete').appendTo('#subcategoryInfo table tbody td:last-child');	
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

			let li = $('<li>').addClass('mdl-list__item').text(`Type: ${curItem.type}, Document: ${curItem.document}, Quantity: ${curItem.quantity}, Price: ${curItem.price}, Date: ${curItem.date}, Counterparty: ${curItem.counterparty}, Total: ${curItem.total}`);
			let deleteItem = $('<button>').addClass('deleteItem mdl-button mdl-js-button mdl-js-ripple-effect').text('Delete').appendTo(li);
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
			let li = $('<li>').attr('class', category.id);
			let primarySpan = $('<span>').addClass('mdl-list__item-primary-content').text(category.name).appendTo(li);
 			li.appendTo(selector);
		};

		function appendToParent	(item) {
			let parentEl = '.' + item.parent;
			let parentUl = '.' + item.parent + ' > ul.submenu';
			if( !($(parentUl).length) ){
				$('<ul>').addClass('submenu mdl-list').appendTo( $(parentEl) );
				$('<i>').addClass('expand material-icons').text('expand_more').prependTo( $(parentEl) )
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


		//search functionality
		function searchByDocument(item, criteria) {
			console.log(criteria);
			if(item.type !== 'collection') return;

			let li = $('<li>').attr('class', item.id).text(`${item.id} ${item.name}`);

			for(let elem of item.items){
				let itemValue = elem[criteria].toString().toLowerCase();

				if(itemValue.indexOf($('#searchTerm').val().toLowerCase()) >= 0){
					if($('#searchDate').is(':checked')){
						if(searchByDate(elem.date)){
							li.text(`${item.id} ${item.name}`);
							$('<span>').text(`${itemValue}`).appendTo(li)
							li.appendTo($('#searchResults ul'));
							$('#searchResults').show();
							break;
						}
					}
					else{
						li.text(`${item.id} ${item.name}`);
						$('<span>').text(`${itemValue}`).appendTo(li);
						li.appendTo($('#searchResults ul'));
						$('#searchResults').show();
						break;
					}
				}		
			}
		}

		function searchByDate(date) {
			let isDateMatched = false,
					dateFrom = $('#dateFrom').val(),
					dateTo = $('#dateTo').val(),
					fromDate,
					toDate;

			if(dateFrom !== '')
				fromDate = new Date( dateFrom.split('-').reverse().join(',') )
			else
				fromDate = ''

			console.log(fromDate);

			// fromDate = new Date( dateFrom.split('-').reverse().join(',') ) || '';

			if(dateTo !== '')
				toDate = new Date( dateTo.split('-').reverse().join(',') );
			else
				toDate = ''

			let dateValue = new Date(  date.split('-').reverse().join(',') );
			if((fromDate === '' && dateValue <= toDate) || (toDate === '' && dateValue >= fromDate) || (dateValue >= fromDate && dateValue <= toDate) || (fromDate === '' && toDate === '') )
				isDateMatched = true;

			return isDateMatched;
		}

		function searchByName(item, criteria) {
			let li = $('<li>').attr('class', item.id).text(`${item.id} ${item.name}`);
			let itemValue = item[criteria].toString().toLowerCase();

			if(itemValue.indexOf($('#searchTerm').val().toLowerCase()) >= 0){
				$('#searchResults').show();	
				li.appendTo($('#searchResults ul'));						
			}
		}

		function search() {
			let criteria = $("input:radio[name ='search']:checked").val();
			$('#searchResults ul').empty();
			if($('#searchTerm').val().length < 1 && criteria != 'date')
				return;
			
			actions = {
				'id': searchByName,
				'name': searchByName,
				'document': searchByDocument,
				'counterparty': searchByDocument,
			};

			for(let item in categories){
				actions[criteria](categories[item], criteria);
			}
		}

 	});
});