erDiagram
    %% BCNF note: CITY has an alternate key UNIQUE(country_name, name)

    USER_ACCOUNT {
        uuid id PK
        text email UK
        text username
        text user_surname
        text password_hash
        datetime birthday
        uuid city_id FK
        text avatar_url
        text bio
        datetime created_at
        datetime updated_at
    }

    USER_ROLE {
        uuid user_id PK, FK
        text role PK
        datetime created_at
    }

    ORGANIZER_PROFILE {
        uuid user_id PK, FK
        text display_name
        text description
        text website_url
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    REFRESH_SESSION {
        text token_hash PK
        uuid user_id FK
        datetime expires_at
        datetime created_at
    }

    CITY {
        uuid id PK
        text name
        text country_name
        text timezone
        datetime created_at
        datetime updated_at
    }

    PLACE {
        uuid id PK
        uuid city_id FK
        text name
        text address_line
        decimal latitude
        decimal longitude
        text description
        datetime created_at
        datetime updated_at
    }

    CATEGORY {
        uuid id PK
        text name UK
        datetime created_at
        datetime updated_at
    }

    TAG {
        uuid id PK
        text name UK
        datetime created_at
        datetime updated_at
    }

    EVENT {
        uuid id PK
        uuid author_user_id FK
        text title
        text location_description
        text full_description
        int age_limit
        text source_url
        datetime created_at
        datetime updated_at
    }

    EVENT_SESSION {
        uuid id PK
        uuid event_id FK
        uuid place_id FK
        datetime start_at
        datetime end_at
        int price
        datetime created_at
        datetime updated_at
    }

    EVENT_IMAGE {
        uuid id PK
        uuid event_id FK
        text image_url
        datetime created_at
        datetime updated_at
    }

    EVENT_CATEGORY {
        uuid event_id PK, FK
        uuid category_id PK, FK
        datetime created_at
        datetime updated_at
    }

    EVENT_TAG {
        uuid event_id PK, FK
        uuid tag_id PK, FK
        datetime created_at
        datetime updated_at
    }

    USER_INTEREST_TAG {
        uuid user_id PK, FK
        uuid tag_id PK, FK
        datetime created_at
    }

    COLLECTION {
        uuid id PK
        uuid author_user_id FK
        text title
        text description
        boolean is_public
        datetime created_at
        datetime updated_at
    }

    COLLECTION_IMAGE {
        uuid id PK
        uuid collection_id FK
        text image_url
        datetime created_at
        datetime updated_at
    }

    COLLECTION_EVENT {
        uuid collection_id PK, FK
        uuid event_id PK, FK
        datetime created_at
        datetime updated_at
    }

    FAVORITE_EVENT {
        uuid user_id PK, FK
        uuid event_id PK, FK
        datetime created_at
        datetime updated_at
    }

    USER_FOLLOW {
        uuid follower_user_id PK, FK
        uuid followed_user_id PK, FK
        datetime created_at
        datetime updated_at
    }

    EVENT_INVITATION {
        uuid id PK
        uuid sender_user_id FK
        uuid recipient_user_id FK
        text message_text
        datetime responded_at
        datetime created_at
        datetime updated_at
    }

    EVENT_INVITATION_EVENT {
        uuid invitation_id PK, FK
        uuid event_id FK
    }

    EVENT_INVITATION_SESSION {
        uuid invitation_id PK, FK
        uuid event_session_id FK
    }

    SHARE_LINK {
        uuid id PK
        uuid creator_user_id FK
        text share_token UK
        datetime created_at
        datetime updated_at
    }

    SHARE_LINK_EVENT {
        uuid share_link_id PK, FK
        uuid event_id FK
    }

    SHARE_LINK_COLLECTION {
        uuid share_link_id PK, FK
        uuid collection_id FK
    }

    NOTIFICATION {
        uuid id PK
        uuid recipient_user_id FK
        text notification_type
        boolean is_read
        datetime read_at
        datetime created_at
        datetime updated_at
    }

    NOTIFICATION_ACTOR {
        uuid notification_id PK, FK
        uuid author_user_id FK
    }

    NOTIFICATION_EVENT {
        uuid notification_id PK, FK
        uuid event_id FK
    }

    NOTIFICATION_EVENT_SESSION {
        uuid notification_id PK, FK
        uuid event_session_id FK
    }

    NOTIFICATION_INVITATION {
        uuid notification_id PK, FK
        uuid invitation_id FK
    }

    NOTIFICATION_COLLECTION {
        uuid notification_id PK, FK
        uuid collection_id FK
    }

    SUPPORT_TICKET {
        uuid id PK
        uuid user_id FK
        text category
        text status
        text title
        text message
        datetime created_at
        datetime updated_at
        datetime closed_at
    }

    SUPPORT_TICKET_MESSAGE {
        uuid id PK
        uuid ticket_id FK
        uuid author_user_id FK
        text author_role
        text body
        datetime created_at
    }

    USER_ACCOUNT }o--|| CITY : "city_id FK"
    USER_ROLE }o--|| USER_ACCOUNT : "user_id FK"
    ORGANIZER_PROFILE ||--|| USER_ACCOUNT : "user_id FK"
    REFRESH_SESSION }o--|| USER_ACCOUNT : "user_id FK"
    PLACE }o--|| CITY : "city_id FK"

    EVENT }o--|| USER_ACCOUNT : "author_user_id FK"
    EVENT_SESSION }o--|| EVENT : "event_id FK"
    EVENT_SESSION }o--|| PLACE : "place_id FK"
    EVENT_IMAGE }o--|| EVENT : "event_id FK"

    EVENT_CATEGORY }o--|| EVENT : "event_id FK"
    EVENT_CATEGORY }o--|| CATEGORY : "category_id FK"

    EVENT_TAG }o--|| EVENT : "event_id FK"
    EVENT_TAG }o--|| TAG : "tag_id FK"
    USER_INTEREST_TAG }o--|| USER_ACCOUNT : "user_id FK"
    USER_INTEREST_TAG }o--|| TAG : "tag_id FK"

    COLLECTION }o--|| USER_ACCOUNT : "author_user_id FK"
    COLLECTION_IMAGE }o--|| COLLECTION : "collection_id FK"
    COLLECTION_EVENT }o--|| COLLECTION : "collection_id FK"
    COLLECTION_EVENT }o--|| EVENT : "event_id FK"

    FAVORITE_EVENT }o--|| USER_ACCOUNT : "user_id FK"
    FAVORITE_EVENT }o--|| EVENT : "event_id FK"

    USER_FOLLOW }o--|| USER_ACCOUNT : "follower_user_id FK"
    USER_FOLLOW }o--|| USER_ACCOUNT : "followed_user_id FK"

    EVENT_INVITATION }o--|| USER_ACCOUNT : "sender_user_id FK"
    EVENT_INVITATION }o--|| USER_ACCOUNT : "recipient_user_id FK"
    EVENT_INVITATION_EVENT ||--|| EVENT_INVITATION : "invitation_id PK, FK"
    EVENT_INVITATION_EVENT }o--|| EVENT : "event_id FK"
    EVENT_INVITATION_SESSION ||--|| EVENT_INVITATION : "invitation_id PK, FK"
    EVENT_INVITATION_SESSION }o--|| EVENT_SESSION : "event_session_id FK"

    SHARE_LINK }o--|| USER_ACCOUNT : "creator_user_id FK"
    SHARE_LINK_EVENT ||--|| SHARE_LINK : "share_link_id PK, FK"
    SHARE_LINK_EVENT }o--|| EVENT : "event_id FK"
    SHARE_LINK_COLLECTION ||--|| SHARE_LINK : "share_link_id PK, FK"
    SHARE_LINK_COLLECTION }o--|| COLLECTION : "collection_id FK"

    NOTIFICATION }o--|| USER_ACCOUNT : "recipient_user_id FK"
    NOTIFICATION_ACTOR ||--|| NOTIFICATION : "notification_id PK, FK"
    NOTIFICATION_ACTOR }o--|| USER_ACCOUNT : "author_user_id FK"
    NOTIFICATION_EVENT ||--|| NOTIFICATION : "notification_id PK, FK"
    NOTIFICATION_EVENT }o--|| EVENT : "event_id FK"
    NOTIFICATION_EVENT_SESSION ||--|| NOTIFICATION : "notification_id PK, FK"
    NOTIFICATION_EVENT_SESSION }o--|| EVENT_SESSION : "event_session_id FK"
    NOTIFICATION_INVITATION ||--|| NOTIFICATION : "notification_id PK, FK"
    NOTIFICATION_INVITATION }o--|| EVENT_INVITATION : "invitation_id FK"
    NOTIFICATION_COLLECTION ||--|| NOTIFICATION : "notification_id PK, FK"
    NOTIFICATION_COLLECTION }o--|| COLLECTION : "collection_id FK"

    SUPPORT_TICKET }o--|| USER_ACCOUNT : "user_id FK"
    SUPPORT_TICKET_MESSAGE }o--|| SUPPORT_TICKET : "ticket_id FK"
    SUPPORT_TICKET_MESSAGE }o--|| USER_ACCOUNT : "author_user_id FK"

## Ограничения и индексы (рекомендуемые)

```sql
-- USER_ROLE: допустимые роли
ALTER TABLE user_role
  ADD CONSTRAINT user_role_allowed_values
  CHECK (role IN ('user', 'organizer', 'admin'));
```
