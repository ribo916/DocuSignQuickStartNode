/**
 * @file
 * Example 002: Remote signer, cc, envelope has three documents
 * @author DocuSign
 */

const fs = require("fs-extra");
const docusign = require("docusign-esign");

/**
 * This function does the work of creating the envelope
 */
const sendEnvelope = async (args) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;

  // Step 1. Make the envelope request body
  let envelope = makeEnvelope(args.envelopeArgs);

  // Step 2. call Envelopes::create API method
  // Exceptions will be caught by the calling function
  results = await envelopesApi.createEnvelope(args.accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return { envelopeId: envelopeId };
};

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName
  // args.status
  // doc2File
  // doc3File

  // document 1 (html) has tag **signature_1**
  // document 2 (docx) has tag /sn1/
  // document 3 (pdf) has tag /sn1/
  //
  // The envelope has two recipients.
  // recipient 1 - signer
  // recipient 2 - cc
  // The envelope will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.

  let doc2DocxBytes, doc3PdfBytes;
  // read files from a local directory
  // The reads could raise an exception if the file is not available!
  doc2DocxBytes = fs.readFileSync(args.doc2File);
  doc3PdfBytes = fs.readFileSync(args.doc3File);

  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document set";

  // add the documents
  let doc1 = new docusign.Document(),
    doc1b64 = Buffer.from(document1(args)).toString("base64"),
    doc2b64 = Buffer.from(doc2DocxBytes).toString("base64"),
    doc3b64 = Buffer.from(doc3PdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Order acknowledgement"; // can be different from actual file name
  doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
  doc1.documentId = "1"; // a label used to reference the doc

  // Alternate pattern: using constructors for docs 2 and 3...
  let doc2 = new docusign.Document.constructFromObject({
    documentBase64: doc2b64,
    name: "Battle Plan", // can be different from actual file name
    fileExtension: "docx",
    documentId: "2",
  });

  let doc3 = new docusign.Document.constructFromObject({
    documentBase64: doc3b64,
    name: "Lorem Ipsum", // can be different from actual file name
    fileExtension: "pdf",
    documentId: "3",
  });

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1, doc2, doc3];

  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object constructor
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    recipientId: "1",
    routingOrder: "1",
  });
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.

  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
  let cc1 = new docusign.CarbonCopy();
  cc1.email = args.ccEmail;
  cc1.name = args.ccName;
  cc1.routingOrder = "2";
  cc1.recipientId = "2";

  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform searches throughout your envelope's
  // documents for matching anchor strings. So the
  // signHere2 tab will be used in both document 2 and 3 since they
  // use the same anchor string for their "signer 1" tabs.
  let signHere1 = docusign.SignHere.constructFromObject({
      anchorString: "**signature_1**",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    }),
    signHere2 = docusign.SignHere.constructFromObject({
      anchorString: "/sn1/",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    });
  // Tabs are set per recipient / signer
  let signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1, signHere2],
  });
  signer1.tabs = signer1Tabs;

  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });
  env.recipients = recipients;

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = args.status;

  return env;
}

/**
 * Creates document 1
 * @function
 * @private
 * @param {Object} args parameters for the envelope
 * @returns {string} A document in HTML format
 */

function document1(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName

  return `
  <!DOCTYPE html>

  <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
      <meta charset="utf-8" />
      <title></title>
      <style>
          p.titleText {
              font-weight: 800;
              font-size: 11.5pt;
              font-family: Calibri, Helvetica;
              text-align: center;
          }
  
          div#textblock {
              padding-left: 2%;
              padding-right: 2%;
              font-family: Calibri, Helvetica;
              font-size: 11.5pt;
              max-width: 800px;
              width: 800px;
              height: 1035px;
              min-height: 1035px;
              max-height: 1035px;
              overflow-wrap: break-word;
          }
  
              div#textblock indent {
                  margin-left: 2%;
              }
  
          ul.empty {
              list-style-type: none;
              margin-top: 0px;
          }
  
          .container {
              width: 100%;
              height: 200px;
              display: flex;
          }
  
          .col1 {
              display: inline-block;
              width: 45%;
              height: 100%;
          }
  
          .col2 {
              position: relative;
              top: 0px;
              display: inline-block;
              width: 45%;
              margin-left: 7%;
              margin-top: 0%;
              height: 100%;
          }
  
              .col2 p {
              }
  
          .dividerText {
              font-weight: bold;
              font-style: italic;
          }
  
          .footer {
              display: flex;
              width: 100%;
              margin-top: 5%;
          }
  
          .logoText {
              display: inline-block;
              text-align: left;
              width: 33%;
          }
  
          .catalogText {
              display: inline-block;
              text-align: center;
              width: 33%;
              font-size: 6pt;
          }
  
          .copyText {
              display: inline-block;
              text-align: right;
              width: 33%;
              font-size: 6pt;
          }
      </style>
      
  </head>
  <body>
      <div id="textblock">
          <p class="titleText">AUTHORIZATION TO RELEASE PAYOFF INFORMATION</p>
          <p>
              Customer(s) Name:______________________________________________________ Date:_______________________<br /><br />
              Lienholder Name:___________________________________________________________________________________<br /><br />
              Trade-In Vehicle Year:______ Make:___________ Model:____________ VIN:___________________________________
          </p>
          <p>
              I acknowledge and agree that I have given the Dealership identified above permission to contact you in order
              to obtain payoff information regarding the above-described trade-in vehicle. I understand that information
              about my account is private and that you may be asked to reveal nonpublic personal information about me to the
              Dealership. I hereby authorize you to release my payoff information to the Dealership and to answer any questions
              that it has with respect to my account. I understand that this information will be used only for the purposes for
              which it has been provided and in accordance with the applicable Privacy Laws. Should the Dealership tender payment
              to payoff the remaining balance owed, I further authorize you to release the title to the trade-in vehicle to the
              Dealership within 10 days of the date of this notice pursuant to RCW 46.12.675. Mail certificate of ownership to the
              payor at the above address.
          </p>
          <div>
              If the title is recorded electronically please order as requested below:
              <ul class="empty">
                  <li>□ Physical Title</li>
                  <li>□ Affidavit in Lieu of Title (may not be good outside WA state)</li>
              </ul>
          </div>
          <p>
              I acknowledge and agree that $___________________ is an estimate of the balance owed on the trade-in vehicle.
              If the actual balance owed on my trade-in vehicle is greater than the estimated figure, I agree to pay the
              difference to the Dealership. If the balance owed is less than the estimated figure, the difference will be
              paid or credited to me.
          </p>
          <div class="container">
              <div class="col1">
                  <p>
                      _______________________________________________<br />
                      Customer
                  </p>
                  <p>
                      _______________________________________________<br />
                      Customer
                  </p>
              </div>
              <div class="col2">
                  <p>
                      _______________________________________________<br />
                      Authorized Dealership Representative
                  </p>
              </div>
  
  
  
          </div>
          <div>
              <span class="dividerText">For Dealership Use Only:</span><br /><br />
              <p>
                  Lienholder Telephone:__________________ Fax:__________________ Contact Person:_______________________________<br /><br />
                  Lienholder Address:______________________________________________________________________________________<br /><br />
                  Payoff Amount $_______________ Quoted To:_______________________ Good Until (20 days recommended):___________<br /><br />
                  Per Diem:______________________ Additional Notes: _________________________________________________________
              </p>
          </div>
          <div class="footer">
              <div class="logoText">-logo-</div> <div class="catalogText">CATALOG #8963932</div> <div class="copyText">©2020 CDK Global, LLC Washington (09/20)</div>
          </div>
      </div>
      
  </body>
  </html>
  `;

// ORIGINAL HTML
/*
    <!DOCTYPE html>
    <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family:sans-serif;margin-left:2em;">
        <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
        <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
          color: darkblue;">Order Processing Division</h2>
        <h4>Ordered by ${args.signerName}</h4>
        <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
        <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
        <p style="margin-top:3em;">
  Candyfdfdf bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
        </p>
        <!-- Note the anchor tag for the signature field is in white. -->
        <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**//*</span></h3>
        </body>
    </html>
*/


}

module.exports = { sendEnvelope };
