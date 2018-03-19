function showStart(){
	console.log('aa');
	$('#addNew').prependTo('main')
	$('#addNew .mdl-card__title button').remove();
	$('#addNew h4').text('Add new category');
	$('#subcategoryInfo').empty();
	clearInputs();
	$('#details').prependTo('#addCategory');
	$('#catType').prependTo('#addCategory');
	$('#catSelect').prependTo('#addCategory');
	$('#catCategory').prop('checked', true);
	$('#details').hide();
	$('#edit').hide();
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