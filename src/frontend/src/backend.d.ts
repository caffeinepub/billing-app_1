import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomerDetails {
    name: string;
    email: string;
    address: string;
}
export interface LineItem {
    description: string;
    quantity: bigint;
    unitPrice: bigint;
}
export interface Invoice {
    id: bigint;
    status: Variant_finalized_draft;
    lineItems: Array<LineItem>;
    customer: CustomerDetails;
    date: bigint;
    invoiceNumber: string;
    totalAmount: bigint;
    currency: string;
    taxAmount: bigint;
    taxRate: bigint;
    subtotal: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_finalized_draft {
    finalized = "finalized",
    draft = "draft"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createInvoice(invoiceNumber: string, customer: CustomerDetails, lineItems: Array<LineItem>, taxRate: bigint, currency: string): Promise<bigint>;
    deleteInvoice(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInvoice(id: bigint): Promise<Invoice>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listInvoices(): Promise<Array<Invoice>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateInvoice(id: bigint, invoiceNumber: string, customer: CustomerDetails, lineItems: Array<LineItem>, taxRate: bigint, currency: string, status: Variant_finalized_draft): Promise<void>;
}
