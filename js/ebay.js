var url = "https://svcs.ebay.com/services/search/FindingService/v1";
    url += "?OPERATION-NAME=findItemsAdvanced";
    url += "&SERVICE-VERSION=1.0.0";
    url += "&SECURITY-APPNAME=JasonRub-RubyRunC-PRD-55d8a3c47-c18c8f4d";
    url += "&GLOBAL-ID=EBAY-US";
    url += "&RESPONSE-DATA-FORMAT=JSON";
    url += "&callback=_load_items";
    url += "&REST-PAYLOAD";

    url += "&paginationInput.entriesPerPage=10";
    url += "&outputSelector=PictureURLSuperSize";
    url += "&itemFilter(0).name=Seller";
    url += "&itemFilter(0).value(0)=the.fat.cat";


// Submit the request 
s=document.createElement('script'); // create script element
s.src= url;
document.body.appendChild(s);


function _load_items(data){
    console.log(data)
    let items = data.findItemsAdvancedResponse["0"].searchResult[0].item;
    items.forEach(function(item){
        $(".items").append(`
            <div class="col s12 m4">
                <div class="card medium">
                    <div class="card-image">
                        <img alt="photo of ${item.title[0]}"src="${item.pictureURLSuperSize}">
                    </div>
                    <div class="card-content">
                        <p>${item.title[0]}</p>
                        <p>Current Price: $${item.sellingStatus["0"].convertedCurrentPrice["0"].__value__}</p>
                        <a href="${item.viewItemURL[0]}" class="waves-effect waves-light btn">Place Bid</a>
                    </div>

                </div>
            </div>
        `)
    })
    
}