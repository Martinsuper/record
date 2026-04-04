package com.record.sync.dto;

import com.record.sync.entity.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPullResult {
    private List<Event> events;
    private List<Anniversary> anniversaries;
    private List<EventType> eventTypes;
    private List<AnniversaryCategory> categories;
    private Long maxVersion;
    private Boolean hasMore;
}
