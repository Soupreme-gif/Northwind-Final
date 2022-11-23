const InvSortType = {
    NAME: "name",
    STOCK_REORDER_RATIO: "stockReorderRatio",
    ORDERED: "ordered",
    STOCK: "stock",
    QUANTITY_PER_UNIT: "quantityPerUnit",
}
const Direction = {
    ASC: 1,
    DESC: -1,
}

const fractionToPercentText = function (number){
    return isFinite(number) ? ((number * 100).toFixed() + "%") : "--"

}


let sortType = InvSortType.STOCK_REORDER_RATIO
let direction = Direction.DESC
const invSort = function (arr) {
    let sortRules = (p1, p2) => { }
    const invStockRatioValue = (p) => ((p.reorderLevel == 0 ? -1000 : (p.unitsInStock + p.unitsOnOrder) / p.reorderLevel) + (p.discontinued ? -1000 : 0));

    switch (sortType) {
        case InvSortType.NAME:
            sortRules = (p1, p2) => p1.productName.localeCompare(p2.productName)
            break;
        case InvSortType.STOCK_REORDER_RATIO:
            sortRules = (p1, p2) => invStockRatioValue(p1) - invStockRatioValue(p2)
            break;
        case InvSortType.QUANTITY_PER_UNIT:
            sortRules = (p1, p2) => p1.quantityPerUnit.localeCompare(p2.quantityPerUnit)
            break;
        case InvSortType.STOCK:
            sortRules = (p1, p2) => p1.unitsInStock - p2.unitsInStock
            break;
        case InvSortType.ORDERED:
            sortRules = (p1,p2) => p1.unitsOnOrder - p2.unitsOnOrder
    }
    return arr.sort( (a, b) => direction * sortRules(a,b))
}

const getInventoryType = () => {
    
}

$(function () {
    getInventory()

    function getApiString() {
        
    }

    function getInventory() {
        let mode = $('#typeform').find(":selected").val();
        var settingText = "";
        switch (Number(mode)) {
            case 0:
                settingText = "";
                break;
            case 1:
                settingText = "/low";
                break;
            case 2:
                settingText = "/discontinued"
                $('#Discontinued').prop('checked', true);

                break;
            default:
                settingText = ""
        } 
        var discontinued = $('#Discontinued').prop('checked');
        $.getJSON({
            url: "../../api/inventory" + settingText,
            success: function (response, textStatus, jqXhr) {
                response = invSort(response)
                console.log(response)
                $('#inventory_rows').html("");

                for (var i = 0; i < response.length; i++) {
                    if (!discontinued && response[i].discontinued){
                        continue;
                    }
                    var classes = response[i].discontinued ? "discontinued" : ""
                    let ratio = (response[i].unitsOnOrder + response[i].unitsInStock) / response[i].reorderLevel
                    if (ratio >= 1 && ratio <= 1.15){
                        classes += " warning"
                    } else if (ratio < 1){
                        classes += " danger"
                    }
                    var row = "<tr class=\"" + classes + "\"" 
                        + " data-id=\"" + response[i].productId
                        + "\" data-name=\"" + response[i].productName
                        + "\" data-quantity-per=\"" + response[i].quantityPerUnit
                        + "\" data-on-order=\"" + response[i].unitsOnOrder
                        + "\" data-in-stock=\"" + response[i].unitsInStock
                        + "\" data-reorder-level=\"" + response[i].reorderLevel
                        + "\">"
                        + "<td>" + response[i].productName + "</td>"
                        + "<td>" + response[i].quantityPerUnit + "</td>"
                        + "<td>" + response[i].unitsOnOrder + "</td>"
                        + "<td>" + response[i].unitsInStock + "</td>"
                        + "<td>" + (response[i].unitsOnOrder + response[i].unitsInStock) + " / " + response[i].reorderLevel +  " </td>"
                        + "<td>" + fractionToPercentText((response[i].unitsOnOrder + response[i].unitsInStock) / response[i].reorderLevel)+  " </td>"
                        + "</tr>";
                    $('#inventory_rows').append(row);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // log the error to the console
                console.log("The following error occured: " + textStatus, errorThrown);
            }
        });
    }
    $('#typeform').on('change', function () {
        getInventory();
    });
    $('.thead-clickable').on('click', function () {
        let clickInput = $(this).data('sort')
        let newVal = ""
        let defaultDirection = Direction.DESC

        $("[id$='icon']").removeClass()

        switch(clickInput){
            case 'name':
                newVal = InvSortType.NAME
                defaultDirection = Direction.ASC
                break;
            case 'quantity':
                newVal = InvSortType.QUANTITY_PER_UNIT
                defaultDirection = Direction.ASC
                break
            case 'order':
                newVal = InvSortType.ORDERED
                defaultDirection = Direction.DESC
                break
            case 'stock':
                newVal = InvSortType.STOCK
                defaultDirection = Direction.DESC
                break;
            case 'ratio':
                newVal = InvSortType.STOCK_REORDER_RATIO
                defaultDirection = Direction.DESC
                break;
        }
        if (newVal === sortType){
            direction = -direction
        } else {
            sortType = newVal
            direction = defaultDirection
        }
        $('#' + clickInput + "-icon").addClass("fa-solid fa-arrow-" + (direction === Direction.ASC ? "up" : "down") + "-short-wide")
       getInventory()

    });
    $('#Discontinued').on('change', function () {
        getInventory();
    });
    // delegated event listener
    $('#inventory_rows').on('click', 'tr', function () {
        // make sure a employee is logged in
        if ($('#User').data('Northwind-Employee').toLowerCase() == "true") {
            $('#ProductId').html($(this).data('id'));
            $('#ProductName').html($(this).data('name'));
            $('#UnitPrice').html($(this).data('price').toFixed(2));
            // calculate and display total in modal
            $('#Quantity').change();
            $('#cartModal').modal();
        } else {
            toast("Access Denied", "You must be signed in as a employee to access the inventory.");
        }
    });
    // update total when cart quantity is changed
    $('#Quantity').change(function () {
        var total = parseInt($(this).val()) * parseFloat($('#UnitPrice').html());
        $('#Total').html(numberWithCommas(total.toFixed(2)));
    });
    // function to display commas in number
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    $('#addToCart').on('click', function () {
        $('#cartModal').modal('hide');
        $.ajax({
            headers: { "Content-Type": "application/json" },
            url: "../../api/addtocart",
            type: 'post',
            data: JSON.stringify({
                "id": Number($('#ProductId').html()),
                "email": $('#User').data('email'),
                "qty": Number($('#Quantity').val())
            }),
            success: function (response, textStatus, jqXhr) {
                // success
                toast("Product Added", response.product.productName + " successfully added to cart.");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // log the error to the console
                console.log("The following error occured: " + jqXHR.status, errorThrown);
                toast("Error", "Please try again later.");
            }
        });
    });
    function toast(header, message) {
        $('#toast_header').html(header);
        $('#toast_body').html(message);
        $('#cart_toast').toast({ delay: 2500 }).toast('show');
    }
});