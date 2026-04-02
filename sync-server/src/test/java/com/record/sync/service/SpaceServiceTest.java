package com.record.sync.service;

import com.record.sync.dto.SpaceCreateResponse;
import com.record.sync.entity.Space;
import com.record.sync.exception.ShareCodeNotFoundException;
import com.record.sync.repository.SpaceRepository;
import com.record.sync.service.SpaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpaceServiceTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private com.record.sync.repository.DeviceRepository deviceRepository;

    @Mock
    private com.record.sync.repository.EventRepository eventRepository;

    @Mock
    private com.record.sync.repository.AnniversaryRepository anniversaryRepository;

    @Mock
    private com.record.sync.repository.EventTypeRepository eventTypeRepository;

    @Mock
    private com.record.sync.repository.AnniversaryCategoryRepository anniversaryCategoryRepository;

    private SpaceService spaceService;

    @BeforeEach
    void setUp() {
        spaceService = new SpaceService(
                spaceRepository, deviceRepository, eventRepository,
                anniversaryRepository, eventTypeRepository, anniversaryCategoryRepository
        );
    }

    @Test
    void createSpace_shouldReturnSpaceIdAndShareCode() {
        when(spaceRepository.existsByShareCode(anyString())).thenReturn(false);
        when(spaceRepository.save(any(Space.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SpaceCreateResponse response = spaceService.createSpace();

        assertNotNull(response.getSpaceId());
        assertNotNull(response.getShareCode());
        assertEquals(6, response.getShareCode().length());

        verify(spaceRepository).save(any(Space.class));
    }

    @Test
    void verifyShareCode_existingCode_shouldReturnSpace() {
        Space space = new Space();
        space.setId("space_test");
        space.setShareCode("ABC123");

        when(spaceRepository.findByShareCode("ABC123")).thenReturn(Optional.of(space));

        Space result = spaceService.verifyShareCode("ABC123");

        assertEquals("space_test", result.getId());
        assertEquals("ABC123", result.getShareCode());
    }

    @Test
    void verifyShareCode_nonExistingCode_shouldThrowException() {
        when(spaceRepository.findByShareCode("INVALID")).thenReturn(Optional.empty());

        assertThrows(ShareCodeNotFoundException.class, () -> {
            spaceService.verifyShareCode("INVALID");
        });
    }
}