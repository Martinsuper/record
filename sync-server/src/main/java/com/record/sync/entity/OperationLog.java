package com.record.sync.entity;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "operation_log", indexes = {
    @Index(name = "idx_op_space_version", columnList = "space_id, server_version"),
    @Index(name = "idx_op_space_entity_id", columnList = "space_id, entity, entity_id")
})
public class OperationLog {
    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 20, nullable = false)
    private String entity;  // event, anniversary, eventType, category

    @Column(name = "entity_id", length = 64, nullable = false)
    private String entityId;

    @Column(length = 10, nullable = false)
    private String operation;  // create, update, delete

    @Column(name = "changed_fields", columnDefinition = "JSON")
    private String changedFields;  // JSON array

    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;  // JSON object

    @Column(name = "client_version")
    private Long clientVersion;

    @Column(name = "server_version")
    private Long serverVersion;

    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "created_at")
    private Long createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = System.currentTimeMillis();
    }
}
