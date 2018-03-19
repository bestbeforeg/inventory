define(function (require) {
	function searchByDocument(item, criteria) {
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
						break;
					}
				}
				else{
					li.text(`${item.id} ${item.name}`);
					$('<span>').text(`${itemValue}`).appendTo(li)
					li.appendTo($('#searchResults ul'));
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
			fromDate = new Date( $('#dateFrom').val().split('-').reverse().join(',') )
		else
			fromDate = ''

		if(dateTo !== '')
			toDate = new Date( $('#dateTo').val().split('-').reverse().join(',') );
		else
			toDate = ''

		let dateValue = new Date(  date.split('-').reverse().join(',') );
		if((fromDate === '' && dateValue <= toDate) || (toDate === '' && dateValue >= fromDate) || (dateValue >= fromDate && dateValue <= toDate) || (fromDate === '' && toDate === '') )
			isDateMatched = true;

		return isDateMatched;
	}

	function searchByName(item, criteria) {
		console.log(item.id);

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

	return {
   	search: search	
  }

});