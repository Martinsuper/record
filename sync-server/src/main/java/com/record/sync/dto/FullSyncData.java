package com.record.sync.dto;

import com.record.sync.entity.Event;
import com.record.sync.entity.Anniversary;
import com.record.sync.entity.EventType;
import com.record.sync.entity.AnniversaryCategory;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

/**
 * 全量同步数据结构
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FullSyncData {

    private String spaceId;
    private String shareCode;
    private List<Event> events;
    private List<Anniversary> anniversaries;
    private List<EventType> eventTypes;
    private List<AnniversaryCategory> anniversaryCategories;
}
