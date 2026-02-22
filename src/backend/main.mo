import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Initialize the storage system
  include MixinStorage();

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Invoice management
  var nextInvoiceId = 1;

  type CustomerDetails = {
    name : Text;
    email : Text;
    address : Text;
  };

  type LineItem = {
    description : Text;
    quantity : Nat;
    unitPrice : Nat; // Store as cents for precision
  };

  type Invoice = {
    id : Nat;
    invoiceNumber : Text;
    date : Int;
    customer : CustomerDetails;
    lineItems : [LineItem];
    subtotal : Nat;
    taxRate : Nat; // Store as percentage (e.g., 5% = 5)
    taxAmount : Nat;
    totalAmount : Nat;
    currency : Text;
    status : {
      #draft;
      #finalized;
    };
  };

  module Invoice {
    public func compare(invoice1 : Invoice, invoice2 : Invoice) : Order.Order {
      Int.compare(invoice1.date, invoice2.date);
    };
  };

  let invoices = Map.empty<Nat, Invoice>();

  public shared ({ caller }) func createInvoice(
    invoiceNumber : Text,
    customer : CustomerDetails,
    lineItems : [LineItem],
    taxRate : Nat,
    currency : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };

    let subtotal = lineItems.values().foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });
    let taxAmount = (subtotal * taxRate) / 100;
    let totalAmount = subtotal + taxAmount;

    let newInvoice : Invoice = {
      id = nextInvoiceId;
      invoiceNumber;
      date = Time.now();
      customer;
      lineItems;
      subtotal;
      taxRate;
      taxAmount;
      totalAmount;
      currency;
      status = #draft;
    };

    invoices.add(nextInvoiceId, newInvoice);
    nextInvoiceId += 1;
    newInvoice.id;
  };

  public query ({ caller }) func getInvoice(id : Nat) : async Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) { invoice };
    };
  };

  public query ({ caller }) func listInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list invoices");
    };

    invoices.values().toArray().sort();
  };

  public shared ({ caller }) func updateInvoice(
    id : Nat,
    invoiceNumber : Text,
    customer : CustomerDetails,
    lineItems : [LineItem],
    taxRate : Nat,
    currency : Text,
    status : {
      #draft;
      #finalized;
    },
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update invoices");
    };

    switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?existing) {
        let subtotal = lineItems.values().foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });
        let taxAmount = (subtotal * taxRate) / 100;
        let totalAmount = subtotal + taxAmount;

        let updatedInvoice : Invoice = {
          existing with
          invoiceNumber;
          customer;
          lineItems;
          subtotal;
          taxRate;
          taxAmount;
          totalAmount;
          currency;
          status;
        };

        invoices.add(id, updatedInvoice);
      };
    };
  };

  public shared ({ caller }) func deleteInvoice(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete invoices");
    };

    if (not invoices.containsKey(id)) { Runtime.trap("Invoice not found") };
    invoices.remove(id);
  };
};
