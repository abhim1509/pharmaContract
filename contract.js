'use strict';
const {Contract} = require('fabric-contract-api');

class pharmaContract extends Contract{
    
    //Constructor of the chaincode.
    constructor(){
        super(org.pharmaNetwork.pharmachannel.pharmaContract);
    }

    //Instantiate function to test if instantiation of the smart contract is successful.
    async instantiate(ctx){
        console.log("Pharmaceutical blockchain Contract instantiated.");
    }

    /*
    * To register a company on the pharma blockchain network.
    * @param ctx - The transaction context.
    * @param companyCRN - The Company Registeration Number of the company to be registered on the pharma blockchain network.
    * @param companyName - The name of the company to be registered on the pharma blockchain network.
    * @param location - Location of the company to be registered on the pharma blockchain network.
    * @param organisationRole - organisation Role of the user to be registered on the blockchain network.
    */
    async registerCompany (ctx, companyCRN, companyName, location, organisationRole){
        //Creates a composite key for the new company.
        const companyCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[companyCRN, companyName]);

        //Assigning hierarchy key as per the organisation role.
        switch(organisationRole.toLowerCase()){
            case "manufacturer" : hierarchyKey = 1;
            case "distributor"  : hierarchyKey = 2;
            case "retailer "    : hierarchyKey = 3;
            case "default"      : hierarchyKey = 0;
        }

        //If organization doesn't belong to any of the roles viz. manufacturer, distributor, retailer than throw an error.
        if(hierarchyKey === 0) throw new Error("Wrong role provided.");

        //Creates a company object to be stored on blockchain.
        let companyDetails = {
            companyID        : companyCompositeKey,
            name             : companyName,
            location         : location,
            organisationRole : organisationRole, 
            hierarchyKey     : hierarchyKey
        }

        //Converts company object to buffer and put it's state on blockchain.
        let dataBuffer = Buffer.from(JSON.stringify(companyDetails));
        await ctx.stub.putState(companyCompositeKey, dataBuffer);
        return companyDetails;
    }

    /*
    * This function adds a drug on the the pharma blockchain network.
    * @param ctx - The transaction context.
    * @param drugName - The name of the drug to be registered on the pharma blockchain network.
    * @param serialNo - Serial number of the drug to be registered on the pharma blockchain network.
    * @param mfgDate  - Manufacturing date of the drug to be registered on the pharma blockchain network.
    * @param expDate  - Expiry date of the drug to be registered on the pharma blockchain network.
    * @param companyCRN - Company Registration Number of the drug to be registered on the pharma blockchain network.
    */
    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN){
        //Retrieves manufacturer name.
        const manufacturerName = ctx.clientIdentity.getId();
        
        //Retrieves a composite key for the manufacturer.
        const manufacturerCompositeKey = 
        ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[companyCRN, manufacturerName]);
        let manufacturerDetailsBuffer = await ctx.stub.getStub(manufacturerCompositeKey).catch(err=>console.log(err));
        
        //Converts the buffered data to string.
        manufacturerDetails = JSON.parse(manufacturerDetailsBuffer.toString());
        
        //Checks if company is a manufacturer.
        if(manufacturerDetails.organisationRole.toLowerCase() === "manufacturer"){
            //Stores the drug's composite key.
            const drugCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[serialNo, drugName]);
            
            //Creates a drug's object to be stored on blockchain.
            let drugDetails = {
                productID : drugCompositeKey,
                name : drugName,
                manufacturer : manufacturerCompositeKey,
                manufacturingDate :  mfgDate,
                expiryDate :  expDate,
                owner : manufacturerCompositeKey,
                shipment: null
            }
        
        //Converts company object to buffer and put it's state on blockchain.    
        let dataBuffer = Buffer.from(JSON.stringify(drugDetails));
        await ctx.stub.putState(drugCompositeKey, dataBuffer);
        }
        //Throws error if registered company is not manufacturer.
        else throw new Error("Registered company is not manufacturer.");
    }

    /*
    * User recharge it's account with coins on the network.
    * @param ctx - The transaction context.
    * @param buyerCRN - Buyer's CRN on the pharma blockchain network.
    * @param sellerCRN - Seller's CRN on the pharma blockchain network.
    * @param quantity - Quantity of drug required.
    * @returns 
    */
   async createPO (ctx, buyerCRN, sellerCRN, drugName, quantity){
    let companyName = ctx.clientIdentity.getId();
    let sellerCompositeKey;
    //Retrieves the composite key.
    let buyerCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[buyerCRN, companyName]);
    let buyerDetailsBuffer = await ctx.stub.getStub(buyerCompositeKey).catch(err=>console.log(err));
    buyerDetails = JSON.parse(buyerDetailsBuffer.toString());

    let manufacturerCompositeKeyIterator = 
    await ctx.stub.getStateByPartialCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract', sellerCRN)
    sellerCompositeKey = manufacturerCompositeKeyIterator.next();
    
    let sellerDetailsBuffer = await ctx.stub.getStub(sellerCompositeKey).catch(err=>console.log(err));
    sellerDetails = JSON.parse(sellerDetailsBuffer.toString());

    if((buyerDetails.organisationRole.toLowerCase() === "distributor" && sellerDetails.organisationRole.toLowerCase() === "manufacturer")
     ||(buyerDetails.organisationRole.toLowerCase() === "retailer" && sellerDetails.organisationRole.toLowerCase() === "distributor")){
            
            let poCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[buyerCRN, drugName]);
        
            //Property details object 
            let purchaseOrderDetails = {
                    poID = poCompositeKey,
                    drugName = drugName,
                    quantity = quantity,
                    buyer = buyerCompositeKey,
                    seller = sellerCompositeKey,
            }
    
            //Converts the proerty detail object to buffer and then puts it on blockchain.
            let dataBuffer = Buffer.from(JSON.stringify(purchaseOrderDetails));
            await ctx.stub.putState(poCompositeKey, dataBuffer);
    }else throw new Error("Hierarchy for purchase is not followed.");    
}
    
/*
    * Creates shipment for the purchase order.
    * @param ctx - The transaction context.
    * @param buyerCRN - Buyer's CRN on the pharma blockchain network.
    * @param listOfAssets - List of assets required.
    * @param transporterCRN - Transporter's CRN on the pharma blockchain network.
    * @returns 
    */
    async createShipment (ctx, buyerCRN, drugName, listOfAssets, transporterCRN ){
        let sellerName = ctx.clientIdentity.getId();
        let sellerDetails;
        
        listOfAssets.map(function(assetCompositeKey){
            drugDetails = await ctx.stub.getStub(assetCompositeKey).catch(err=>console.log(err));
        });

        sellerCRN = drugDetails.owner;

        let sellerCompositeKey = 
            ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[sellerCRN, sellerName]);
            sellerDetails = await ctx.stub.getStub(sellerCompositeKey).catch(err=>console.log(err));

        //Retrieves the composite key.
        let buyerCompositeKeyIterator = 
        await ctx.stub.getStateByPartialCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract', [buyerCRN]);
        buyerCompositeKey = buyerCompositeKeyIterator.next();
        let buyerDetails = await ctx.stub.getStub(transporterCompositeKey).catch(err=>console.log(err));
        
        if((buyerDetails.organisationRole.toLowerCase() === "distributor" && sellerDetails.organisationRole.toLowerCase() === "manufacturer")
        ||(buyerDetails.organisationRole.toLowerCase() === "retailer" && sellerDetails.organisationRole.toLowerCase() === "distributor")){
            //Shipment composite key
            let shipmentCompositeKey 
            = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[buyerCRN, drugName]);
        
            //Transporter composite key iterator
            let transporterCompositeKeyIterator = 
            await ctx.stub.getStateByPartialCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract', [transporterCRN]);
            transporterCompositeKey = transporterCompositeKeyIterator.next();
            await ctx.stub.getStub(transporterCompositeKey).catch(err=>console.log(err));
            
            let poCompositeKey = 
            ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[buyerCRN, sellerName]);
            poDetails = await ctx.stub.getStub(poCompositeKey).catch(err=>console.log(err));
        
            const status = "in-transit";
            if(poDetails.quantity === (listOfAssets.length+1)){
                //shipment details object 
                let shipmentDetails = {
                    shipmentID = shipmentCompositeKey,
                    creator = sellerCRN,
                    assets = listOfAssets,
                    transporter = transporterCompositeKey,
                    status = status,
                }
                //Converts the proerty detail object to buffer and then puts it on blockchain.
                let dataBuffer = Buffer.from(JSON.stringify(shipmentDetails));
                await ctx.stub.putState(shipmentCompositeKey, dataBuffer);

                listOfAssets.map(function(assetCompositeKey){
                    drugDetails = await ctx.stub.getStub(assetCompositeKey).catch(err=>console.log(err));
                    drugDetails.owner = transporter;
                });

                return shipmentDetails;
            }else throw Error("List of assets don't match the purchase order.");     
        }else throw Error("Company role is not proper.");        
    }


    async updateShipment(ctx, buyerCRN, drugName, transporterCRN){
        const transporterName = ctx.clientIdentity.getId();
    
        //Retrieves the composite key.
        const transporterCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[transporterCRN, transporterName]);
        let transporterDetailsBuffer = await ctx.stub.getStub(transporterCompositeKey).catch(err=>console.log(err));
        let transporterDetails = JSON.parse(transporterDetailsBuffer.toString());
    
        if(transporterDetails.organisationRole.toLowerCase() === "transporter"){
            const shipmentCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[buyerCRN, drugName]);   
            let shipmentDetailsBuffer = await ctx.stub.getStub(shipmentCompositeKey).catch(err=>console.log(err));
            let shipmentDetails = JSON.parse(shipmentDetailsBuffer.toString());
            
            shipmentDetails.status = "Delivered";
            let buyerCompositeKeyIterator = 
            await ctx.stub.getStateByPartialCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract', [buyerCRN]);
            buyerCompositeKey = buyerCompositeKeyIterator.next();
            
            shipmentDetails.assets.map(function(assetCompositeKey){
                assetCompositeKey.owner = buyerCompositeKey;
                assetCompositeKey.shipment = shipmentCompositeKey;
            });
            
        } else throw new Error("Organization is not a transporter.");

    }

    /*

The status of the shipment is changed to ‘delivered’.
The composite key of the shipment object is added to the shipment list which is a part of each item of the consignment. For example, imagine there are 10 strips of ‘paracetamol’ in a particular consignment. When this consignment is delivered to the buyer, then each item of the consignment is updated with the shipment object’s key.
Note: Refer to the note added in the definition for addDrug() transaction. 
The owner field of each item of the consignment is updated.

    */
    retailDrug (drugName, serialNo, retailerCRN, customerAadhar){
        const companyName = ctx.clientIdentity.getId();
        const retailerCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[retailerCRN, companyName]);
        let retailerDetailsBuffer = await ctx.stub.getStub(retailerCompositeKey).catch(err=>console.log(err));
        let retailerDetails = JSON.parse(retailerDetailsBuffer.toString());
    
        if(retailerDetails.organisationRole.toLowerCase() === "retailer"){
            const drugCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[serialNo, drugName]);
            let drugDetailsBuffer = await ctx.stub.getStub(drugCompositeKey).catch(err=>console.log(err));
            let drugDetails = JSON.parse(drugDetailsBuffer.toString());
             
            drugDetails.owner = customerAadhar;

            let dataBuffer = Buffer.from(JSON.stringify(drugDetails));
            await ctx.stub.putState(drugCompositeKey, dataBuffer);
        }
        else throw new Error("Wrong details entered as retailer.");
    }

    /*
    * View a user on the network.
    * @param ctx - The transaction context.
    * @param userName - The name of the user to be registered on the blockchain network.
    * @param aadharNumber - Aadhar number of the user to be registered on the blockchain network.
    * @returns 
    */
   async  viewHistory (ctx, drugName, serialNo){
    //Creates a composite key for the new user.
    const drugCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[serialNo, drugName]);
    //let userDetailsBuffer = await ctx.stub.getStub(userCompositeKey).catch(err=>console.log(err));
    //https://stackoverflow.com/questions/45008607/how-to-query-ledger-and-historic-data-in-hyper-ledger-fabric
    //need to make sure history db is enabled, in core.yaml file part of the ledger section:
    let historyDetails = ctx.stub.getHistoryForKey(drugCompositeKey).catch(err=>console.log(err));
    //Returns the result after converting buffer to string.
    console.log("+++++++++++++historyDetails++++++++++"+historyDetails.toString());
    return JSON.parse(historyDetails.toString());    
    }

        
    /*
    * Views current state of the drug on the pharma blockchain network.
    * @param ctx - The transaction context.
    * @param drugName - Drug name on the pharma blockchain network.
    * @param serialNo - Serial number of the drug on the pharma blockchain network.
    * @returns 
    */    
    async viewDrugCurrentState (ctx, drugName, serialNo){
        //Retrieves a composite key for the property.
        const drugCompositeKey = ctx.stub.createCompositeKey('org.pharmaNetwork.pharmachannel.pharmaContract',[serialNo, drugName]);
        let drugDetailsBuffer = await ctx.stub.getStub(drugCompositeKey).catch(err=>console.log(err));
        
        //Returns the result after converting buffer to string. 
        return JSON.parse(drugDetailsBuffer.toString());    
    }
}

module.exports = pharmaContract;

