<#import "template.ftl" as layout>
<@layout.emailLayout title=msg("passwordResetSubject") button=msg("arcButton.UPDATE_PASSWORD") link=link>
${kcSanitize(msg("arcLinkWorks", linkExpirationFormatter(linkExpiration)))?no_esc}
</@layout.emailLayout>
