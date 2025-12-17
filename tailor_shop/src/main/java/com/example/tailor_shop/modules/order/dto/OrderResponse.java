package com.example.tailor_shop.modules.order.dto;

import com.example.tailor_shop.modules.order.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class OrderResponse {

    private Long id;
    private String code;
    private OrderStatus status;
    private BigDecimal total;
    private BigDecimal expectedBudget;
    private BigDecimal depositAmount;
    private String note;
    private Party customer;
    private Party tailor;
    private String customerPhone;
    private LocalDate appointmentDate;
    private LocalDate dueDate;
    private Instant createdAt;
    private Instant updatedAt;
    private List<Item> items;
    private Measurement measurement;
    private List<Timeline> timeline;
    private List<Payment> payments;
    private List<Attachment> attachments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getExpectedBudget() {
        return expectedBudget;
    }

    public void setExpectedBudget(BigDecimal expectedBudget) {
        this.expectedBudget = expectedBudget;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Party getCustomer() {
        return customer;
    }

    public void setCustomer(Party customer) {
        this.customer = customer;
    }

    public Party getTailor() {
        return tailor;
    }

    public void setTailor(Party tailor) {
        this.tailor = tailor;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public List<Timeline> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<Timeline> timeline) {
        this.timeline = timeline;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }

    public Measurement getMeasurement() {
        return measurement;
    }

    public void setMeasurement(Measurement measurement) {
        this.measurement = measurement;
    }

    public static class Party {
        private Long id;
        private String name;

        public Party() {
        }

        public Party(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class Item {
        private Long id;
        private Long productId;
        private Long fabricId;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String productName;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Long getFabricId() {
            return fabricId;
        }

        public void setFabricId(Long fabricId) {
            this.fabricId = fabricId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }

        public BigDecimal getSubtotal() {
            return subtotal;
        }

        public void setSubtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }
    }

    public static class Measurement {
        private Double height;
        private Double weight;
        private Double neck;
        private Double chest;
        private Double waist;
        private Double hip;
        private Double shoulder;
        private Double sleeve;
        private Double bicep;
        private Double thigh;
        private Double crotch;
        private Double ankle;
        private Double shirtLength;
        private Double pantsLength;
        private String fitPreference;
        private String note;

        public Double getHeight() {
            return height;
        }

        public void setHeight(Double height) {
            this.height = height;
        }

        public Double getWeight() {
            return weight;
        }

        public void setWeight(Double weight) {
            this.weight = weight;
        }

        public Double getNeck() {
            return neck;
        }

        public void setNeck(Double neck) {
            this.neck = neck;
        }

        public Double getChest() {
            return chest;
        }

        public void setChest(Double chest) {
            this.chest = chest;
        }

        public Double getWaist() {
            return waist;
        }

        public void setWaist(Double waist) {
            this.waist = waist;
        }

        public Double getHip() {
            return hip;
        }

        public void setHip(Double hip) {
            this.hip = hip;
        }

        public Double getShoulder() {
            return shoulder;
        }

        public void setShoulder(Double shoulder) {
            this.shoulder = shoulder;
        }

        public Double getSleeve() {
            return sleeve;
        }

        public void setSleeve(Double sleeve) {
            this.sleeve = sleeve;
        }

        public Double getBicep() {
            return bicep;
        }

        public void setBicep(Double bicep) {
            this.bicep = bicep;
        }

        public Double getThigh() {
            return thigh;
        }

        public void setThigh(Double thigh) {
            this.thigh = thigh;
        }

        public Double getCrotch() {
            return crotch;
        }

        public void setCrotch(Double crotch) {
            this.crotch = crotch;
        }

        public Double getAnkle() {
            return ankle;
        }

        public void setAnkle(Double ankle) {
            this.ankle = ankle;
        }

        public Double getShirtLength() {
            return shirtLength;
        }

        public void setShirtLength(Double shirtLength) {
            this.shirtLength = shirtLength;
        }

        public Double getPantsLength() {
            return pantsLength;
        }

        public void setPantsLength(Double pantsLength) {
            this.pantsLength = pantsLength;
        }

        public String getFitPreference() {
            return fitPreference;
        }

        public void setFitPreference(String fitPreference) {
            this.fitPreference = fitPreference;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }

    public static class Timeline {
        private Long id;
        private OrderStatus status;
        private String note;
        private Instant createdAt;
        private String createdBy;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public OrderStatus getStatus() {
            return status;
        }

        public void setStatus(OrderStatus status) {
            this.status = status;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public String getCreatedBy() {
            return createdBy;
        }

        public void setCreatedBy(String createdBy) {
            this.createdBy = createdBy;
        }
    }

    public static class Payment {
        private Long id;
        private BigDecimal amount;
        private String method;
        private String status;
        private String txnRef;
        private Instant createdAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getTxnRef() {
            return txnRef;
        }

        public void setTxnRef(String txnRef) {
            this.txnRef = txnRef;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class Attachment {
        private Long id;
        private String name;
        private String url;
        private String type;
        private Instant createdAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }
}
